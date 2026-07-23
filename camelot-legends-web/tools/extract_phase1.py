import json
import hashlib
import re
import zipfile
from collections import defaultdict
from html import unescape
from pathlib import Path


ARCHIVE_ROOT = Path(r"C:\Users\Thomas\My Drive\CamleotLegends-GameFiles")
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = PROJECT_ROOT / "public" / "content"
DOCS_DIR = PROJECT_ROOT / "docs"


def read_text(path: Path) -> str:
    data = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def docx_text(path: Path) -> str:
    try:
        with zipfile.ZipFile(path) as archive:
            xml = archive.read("word/document.xml").decode("utf-8", errors="replace")
    except Exception:
        return ""
    text = re.sub(r"<[^>]+>", " ", xml)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_id(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "unknown"


def asset_id_for(rel: Path) -> str:
    normalized = normalize_id(str(rel))
    digest = hashlib.sha1(str(rel).lower().encode("utf-8")).hexdigest()[:8]
    return f"{normalized}-{digest}"


def clean_value(raw: str) -> str:
    value = raw.strip()
    value = re.sub(r",+\s*$", "", value).strip()
    return repair_mojibake(value)


def repair_mojibake(value: str) -> str:
    if not any(marker in value for marker in ("â", "Ã", "Â")):
        return value
    try:
        repaired = value.encode("cp1252").decode("utf-8")
    except UnicodeError:
        return value
    old_markers = sum(value.count(marker) for marker in ("â", "Ã", "Â"))
    new_markers = sum(repaired.count(marker) for marker in ("â", "Ã", "Â"))
    return repaired if new_markers < old_markers else value


def confidence_for(key: str, value: str) -> str:
    if not value or value == key or value.endswith("_NAME") or value.endswith("_DESCRIPTION"):
        return "LOW"
    return "HIGH"


def source_item(item_id, display_name, description, source, confidence="MEDIUM", notes=""):
    return {
        "id": item_id,
        "displayName": display_name,
        "description": description,
        "sourceFile": str(source),
        "confidence": confidence,
        "notes": notes,
    }


def parse_game_bible():
    path = ARCHIVE_ROOT / "Camelot_Legends-GameBible.csv"
    rows = []
    for line_number, line in enumerate(read_text(path).splitlines(), start=1):
        if "^" not in line:
            continue
        key, raw = line.split("^", 1)
        key = key.strip()
        value = clean_value(raw)
        if not key:
            continue
        rows.append({"key": key, "value": value, "line": line_number, "source": path})
    return rows


def extract_areas(rows):
    grouped = defaultdict(dict)
    sources = defaultdict(list)
    for row in rows:
        match = re.match(r"AREA_(\d+)_(NAME|DESCRIPTION)$", row["key"])
        if not match:
            continue
        number, field = match.groups()
        grouped[number][field.lower()] = row["value"]
        sources[number].append(row["line"])
    areas = []
    for number in sorted(grouped, key=lambda x: int(x)):
        data = grouped[number]
        name = data.get("name") or f"Area {number}"
        desc = data.get("description") or ""
        conf = "LOW" if name.startswith("AREA_") or desc.startswith("AREA_") else "HIGH"
        areas.append(
            source_item(
                f"area-{int(number):03d}",
                name,
                desc,
                ARCHIVE_ROOT / "Camelot_Legends-GameBible.csv",
                conf,
                f"GameBible lines {min(sources[number])}-{max(sources[number])}",
            )
        )
    return areas


def extract_dialogue(rows):
    dialogue = []
    for row in rows:
        npc = re.match(r"DIALOG_NPC_NAME_(\d+)$", row["key"])
        text = re.match(r"DIALOG_TEXT_(\d+)$", row["key"])
        if npc:
            dialogue.append(
                source_item(
                    f"dialogue-npc-{int(npc.group(1)):03d}",
                    row["value"],
                    row["value"],
                    row["source"],
                    confidence_for(row["key"], row["value"]),
                    f"NPC name key {row['key']} at line {row['line']}",
                )
            )
        elif text:
            dialogue.append(
                source_item(
                    f"dialogue-text-{int(text.group(1)):03d}",
                    f"Dialogue Text {int(text.group(1))}",
                    row["value"],
                    row["source"],
                    confidence_for(row["key"], row["value"]),
                    f"Dialogue text key {row['key']} at line {row['line']}",
                )
            )
    return sorted(dialogue, key=lambda item: item["id"])


def extract_skills(rows):
    skills = []
    for row in rows:
        if not row["key"].startswith("SKILL_"):
            continue
        key = row["key"]
        class_match = re.match(r"SKILL_([A-Z]+)_", key)
        class_code = class_match.group(1) if class_match else "UNKNOWN"
        if "_NAME" in key:
            display = row["value"]
            desc = ""
        elif "_DESCRIPTION" in key:
            display = key
            desc = row["value"]
        else:
            display = row["value"] or key
            desc = row["value"]
        skills.append(
            source_item(
                normalize_id(key),
                display,
                desc,
                row["source"],
                confidence_for(key, row["value"]),
                f"Class code {class_code}; source key {key}; line {row['line']}",
            )
        )
    return skills


EQUIPMENT_WORDS = ("HELM", "ARMOR", "BOOT", "RING", "NECKLACE", "WEAPON", "SWORD", "SHIELD")


def extract_items_and_equipment(rows):
    items_by_base = defaultdict(dict)
    lines = defaultdict(list)
    for row in rows:
        key = row["key"]
        if key.startswith(("AREA_", "DIALOG_", "SKILL_")):
            continue
        match = re.match(r"(.+)_(NAME|DESCRIPTION)$", key)
        if not match:
            continue
        base, field = match.groups()
        items_by_base[base][field.lower()] = row["value"]
        lines[base].append(row["line"])

    equipment = []
    items = []
    for base in sorted(items_by_base):
        record = items_by_base[base]
        name = record.get("name") or base
        desc = record.get("description") or ""
        is_equipment = any(word in base for word in EQUIPMENT_WORDS)
        target = equipment if is_equipment else items
        conf = "LOW" if name == f"{base}_NAME" or desc == f"{base}_DESCRIPTION" else "MEDIUM"
        target.append(
            source_item(
                normalize_id(base),
                name,
                desc,
                ARCHIVE_ROOT / "Camelot_Legends-GameBible.csv",
                conf,
                f"Source key base {base}; GameBible lines {min(lines[base])}-{max(lines[base])}",
            )
        )
    return items, equipment


def extract_worlds(areas):
    worlds = []
    for world_number in range(1, 9):
        start = (world_number - 1) * 5 + 1
        end = world_number * 5
        area_ids = [area["id"] for area in areas if start <= int(area["id"].split("-")[1]) <= end]
        worlds.append(
            source_item(
                f"world-{world_number:02d}",
                f"World {world_number}",
                f"Recovered planning says 8 worlds x 5 areas; this groups areas {start}-{end}.",
                ARCHIVE_ROOT / "CAMELOT LEGENDS NEW_GDD.docx",
                "MEDIUM",
                f"Derived grouping, not an explicit runtime world record. Area ids: {', '.join(area_ids)}",
            )
        )
    return worlds


def extract_characters():
    gdd = docx_text(ARCHIVE_ROOT / "CAMELOT LEGENDS NEW_GDD.docx")
    script = docx_text(ARCHIVE_ROOT / "CamelotLegendsScript6.docx")
    names = {
        "Geoffrey": "Paladin: Geoffrey (Male Human)",
        "Elisabeth": "Mage: Elisabeth (Female Elf)",
        "Baldwine": "Warrior: Baldwine (Male Human)",
        "Rosemary": "Rosemary (Female Human)",
        "Mystery": "Stranger: Mystery (Female Human)",
        "Vivian": "Twin Lady of the Lake",
        "Vivien": "Twin Lady of the Lake",
        "Davious": "The Bandit King",
        "Imam": "Chief of the Kadir Clan",
        "Forgon": "Blade of Morgan",
        "Winford": "Shield of Morgan",
        "Mordred": "The Bane Prince",
        "Aubriet": "Daz/Unity character prefab",
        "Estella": "Daz/Unity character prefab",
        "Riadok": "Daz/Unity character prefab",
        "Tosham": "Daz/Unity character prefab",
    }
    characters = []
    combined = f"{gdd} {script}"
    for name, note in names.items():
        seen = name in combined or (ARCHIVE_ROOT / "Main_Characters" / f"{name}.jpg").exists()
        source = ARCHIVE_ROOT / "CAMELOT LEGENDS NEW_GDD.docx"
        if name in {"Aubriet", "Estella", "Riadok", "Tosham"}:
            source = ARCHIVE_ROOT / "4Characters-for-Unity" / "Assets" / "Scenes" / "SampleScene.unity"
        characters.append(
            source_item(
                normalize_id(name),
                name,
                note,
                source,
                "HIGH" if seen else "MEDIUM",
                "Named in GDD/script or instantiated in Unity sample scene.",
            )
        )
    return characters


def extract_classes(characters):
    class_rows = [
        ("paladin", "Paladin", "Recovered from GDD line: Paladin: Geoffrey (Male Human)", "HIGH"),
        ("mage", "Mage", "Recovered from GDD line: Mage: Elisabeth (Female Elf)", "HIGH"),
        ("warrior", "Warrior", "Recovered from GDD line: Warrior: Baldwine (Male Human)", "HIGH"),
        ("healer", "Healer / Galan", "Recovered from script reference to Galan/healer.", "MEDIUM"),
        ("rogue", "Rogue", "Recovered from script description of a mysterious rogue.", "MEDIUM"),
        ("archer", "Archer", "Recovered from script description of an elite archer.", "MEDIUM"),
    ]
    return [
        source_item(
            f"class-{item_id}",
            name,
            description,
            ARCHIVE_ROOT / "CAMELOT LEGENDS NEW_GDD.docx",
            confidence,
            "Class taxonomy is design-derived; no runtime class system survives.",
        )
        for item_id, name, description, confidence in class_rows
    ]


def extract_enemies(rows):
    enemies = []
    enemy_like = ("ANAKIM", "BANDIT", "MORGANA", "MORDRED", "FORGON", "WINFORD", "REPHAIM")
    seen = set()
    for row in rows:
        base = row["key"].split("_")[0]
        if base in enemy_like and base not in seen:
            seen.add(base)
            enemies.append(
                source_item(
                    normalize_id(base),
                    row["value"] if row["value"] and row["value"] != row["key"] else base.title(),
                    row["value"],
                    row["source"],
                    confidence_for(row["key"], row["value"]),
                    f"Enemy-like key {row['key']} at line {row['line']}; runtime stats not recovered.",
                )
            )
    for name in ("Davious", "Imam", "Forgon", "Winford", "Mordred", "Rephaim"):
        if normalize_id(name) not in {item["id"] for item in enemies}:
            enemies.append(
                source_item(
                    normalize_id(name),
                    name,
                    "Boss/opponent role recovered from GDD/script material.",
                    ARCHIVE_ROOT / "CAMELOT LEGENDS NEW_GDD.docx",
                    "MEDIUM",
                    "Design evidence only; no enemy runtime record or stats found.",
                )
            )
    return enemies


def extract_missions(areas):
    missions = []
    for area in areas:
        if not area["displayName"].startswith("Ep."):
            continue
        mission_id = area["id"].replace("area", "mission")
        missions.append(
            source_item(
                mission_id,
                area["displayName"],
                area["description"],
                area["sourceFile"],
                area["confidence"],
                f"Mission inferred from area episode record {area['id']}.",
            )
        )
    return missions


def extract_scenes(areas):
    scenes = []
    for area in areas:
        if area["confidence"] == "LOW":
            continue
        scenes.append(
            source_item(
                area["id"].replace("area", "scene"),
                area["displayName"],
                area["description"],
                area["sourceFile"],
                area["confidence"],
                f"Scene placeholder derived from area content {area['id']}; navigation graph not recovered.",
            )
        )
    return scenes


def likely_use_for(path: Path):
    lower = str(path).lower()
    suffix = path.suffix.lower()
    if "\\assets\\arena" in lower:
        return "arena ui reference; defer multiplayer/runtime use"
    if "\\assets\\battle" in lower:
        return "battle screen ui"
    if "main menu" in lower:
        return "main menu ui"
    if "player interface" in lower:
        return "player hud/ui"
    if "main_characters" in lower or suffix in {".fbx", ".dtu"}:
        return "character art/model"
    if suffix in {".gif", ".anim", ".controller"}:
        return "animation reference"
    if suffix in {".psd"}:
        return "source art; convert before web runtime"
    if suffix in {".doc", ".docx", ".xlsx", ".pptx", ".pdf", ".csv", ".rtf"}:
        return "source design/content document"
    return "visual asset/reference"


def asset_type(path: Path):
    suffix = path.suffix.lower()
    if suffix in {".png", ".jpg", ".jpeg", ".gif", ".psd"}:
        return "image"
    if suffix in {".fbx", ".dtu"}:
        return "model"
    if suffix in {".anim", ".controller", ".unity", ".prefab", ".mat", ".shadergraph", ".unitypackage"}:
        return "unity-asset"
    if suffix in {".doc", ".docx", ".xlsx", ".pptx", ".pdf", ".csv", ".rtf", ".md", ".txt"}:
        return "document"
    if suffix == ".zip":
        return "archive"
    return suffix.lstrip(".") or "unknown"


def needs_conversion(path: Path):
    suffix = path.suffix.lower()
    if suffix in {".psd", ".fbx", ".dtu", ".anim", ".controller", ".unity", ".prefab", ".mat", ".shadergraph", ".unitypackage", ".doc", ".docx", ".xlsx", ".pptx", ".pdf", ".rtf", ".zip"}:
        return "yes"
    if path.stat().st_size > 1_500_000:
        return "yes"
    return "no"


def licensing_notes(path: Path):
    lower = str(path).lower()
    if "cratpix" in lower or "craftpix" in lower:
        return "Third-party CraftPix/Cratpix material; verify license before redistribution."
    if "daz3d" in lower:
        return "Daz/Unity bridge or Daz-exported asset; verify Daz asset rights before shipping."
    return ""


def extract_asset_manifest():
    manifest = []
    skip_dirs = {"Library"}
    for path in ARCHIVE_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        rel = path.relative_to(ARCHIVE_ROOT)
        suffix = path.suffix.lower()
        confidence = "HIGH" if suffix in {".png", ".jpg", ".jpeg", ".gif", ".csv", ".docx", ".fbx"} else "MEDIUM"
        if path.name.lower() == "thumbs.db":
            confidence = "LOW"
        manifest.append(
            {
                "id": asset_id_for(rel),
                "originalPath": str(path),
                "assetType": asset_type(path),
                "likelyUse": likely_use_for(path),
                "fileSize": path.stat().st_size,
                "needsConversion": needs_conversion(path),
                "confidence": confidence,
                "licensingNotes": licensing_notes(path),
            }
        )
    return sorted(manifest, key=lambda item: item["originalPath"].lower())


def write_json(name, data):
    path = CONTENT_DIR / name
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_doc(name, content):
    path = DOCS_DIR / name
    path.write_text(content.strip() + "\n", encoding="utf-8")


def doc_table_counts(outputs):
    lines = ["| File | Records |", "|---|---:|"]
    for name, data in outputs.items():
        lines.append(f"| `public/content/{name}` | {len(data)} |")
    return "\n".join(lines)


def main():
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    rows = parse_game_bible()
    areas = extract_areas(rows)
    dialogue = extract_dialogue(rows)
    skills = extract_skills(rows)
    items, equipment = extract_items_and_equipment(rows)
    worlds = extract_worlds(areas)
    characters = extract_characters()
    classes = extract_classes(characters)
    enemies = extract_enemies(rows)
    missions = extract_missions(areas)
    scenes = extract_scenes(areas)
    assets = extract_asset_manifest()

    outputs = {
        "worlds.json": worlds,
        "areas.json": areas,
        "scenes.json": scenes,
        "characters.json": characters,
        "classes.json": classes,
        "enemies.json": enemies,
        "skills.json": skills,
        "items.json": items,
        "equipment.json": equipment,
        "dialogue.json": dialogue,
        "missions.json": missions,
        "asset-manifest.json": assets,
    }
    for name, data in outputs.items():
        write_json(name, data)

    placeholder_areas = [area for area in areas if area["confidence"] == "LOW"]
    immediate_assets = [asset for asset in assets if asset["needsConversion"] == "no"]
    conversion_assets = [asset for asset in assets if asset["needsConversion"] == "yes"]

    write_doc(
        "CONTENT_EXTRACTION_REPORT.md",
        f"""
# Content Extraction Report

Source archive: `{ARCHIVE_ROOT}`

The archive was treated as read-only. Generated records preserve `sourceFile`, `confidence`, and `notes` so uncertain material stays visible.

## Extracted Record Counts

{doc_table_counts(outputs)}

## Successfully Extracted

- Area and episode records from `Camelot_Legends-GameBible.csv`.
- Dialogue NPC names and dialogue text from `Camelot_Legends-GameBible.csv`.
- Skill names/descriptions from `Camelot_Legends-GameBible.csv`.
- Equipment/item candidate records from `Camelot_Legends-GameBible.csv`.
- Character and class seeds from `CAMELOT LEGENDS NEW_GDD.docx`, `CamelotLegendsScript6.docx`, and the Unity sample scene.
- Asset manifest from all non-`Library` archive files.

## Missing Or Ambiguous

- Runtime gameplay logic is not present: no combat engine, inventory engine, save/load, or game loop survived.
- {len(placeholder_areas)} area records look like placeholders, for example `{placeholder_areas[0]['displayName'] if placeholder_areas else 'none'}`.
- Enemy records are design-derived. Runtime stats, AI, encounter tables, and reward tables are not recovered.
- World grouping is derived from the GDD phrase `8 worlds x 5 area`; explicit world runtime data was not found.
- Arena/lobby assets exist, but no backend, matchmaking, account, or multiplayer code was found.

## Immediately Usable Assets

{len(immediate_assets)} assets appear directly usable as browser image/reference assets without mandatory conversion, mainly PNG/JPG/GIF files.

## Assets Needing Conversion

{len(conversion_assets)} assets need conversion, optimization, rights review, or engine-specific handling. This includes PSD, FBX, Unity assets, archives, Office documents, and very large images.
""",
    )

    write_doc(
        "CONTENT_SCHEMA.md",
        """
# Content Schema

All extracted gameplay/content records use this common shape:

```ts
type Confidence = "HIGH" | "MEDIUM" | "LOW";

type RecoveredContentRecord = {
  id: string;
  displayName: string;
  description: string;
  sourceFile: string;
  confidence: Confidence;
  notes: string;
};
```

`asset-manifest.json` uses:

```ts
type AssetManifestRecord = {
  id: string;
  originalPath: string;
  assetType: string;
  likelyUse: string;
  fileSize: number;
  needsConversion: "yes" | "no";
  confidence: Confidence;
  licensingNotes: string;
};
```

Notes:

- `HIGH` means the source directly names the record and has useful content.
- `MEDIUM` means the record is inferred from design wording, naming, or folder context.
- `LOW` means the record is placeholder-like, obsolete/cache material, or needs manual review.
- Do not promote inferred records to canonical game data until a human review accepts them.
""",
    )

    write_doc(
        "REBUILD_PLAN.md",
        """
# Camelot Legends Web Rebuild Plan

## Direction

Build a new web-first single-player Camelot Legends game. Treat the old Unity/Daz archive as source material, not the runtime engine.

## Why Not Unity First

The surviving Unity material is incomplete: no `ProjectSettings`, no `Packages`, no gameplay scripts, no build metadata, and no deployable build. Rebuilding missing game systems inside Unity would add overhead without restoring a runnable historical project.

## Target

- Local desktop browser.
- Mobile browser usability.
- Single-player only for the first playable Beta.
- No backend, login, multiplayer, online arena, or account system in this phase.

## Vertical Slice Scope

Main Menu -> Start Game -> Intro Scene -> Area 1 -> Dialogue -> Item/equipment pickup -> Basic battle -> Victory/defeat -> Save -> Load.

Use recovered Camelot Legends content. If a required detail is missing, mark it as a Beta design gap rather than inventing historical content.

## Implementation Order

1. Content loader.
2. Game state manager.
3. Scene/navigation engine.
4. Dialogue engine.
5. Inventory/equipment engine.
6. Combat engine.
7. Browser save/load.
8. Responsive mobile UI shell.
9. Asset optimization/conversion.
10. PWA/offline support.

## Flags

- `local browser` on desktop is straightforward with a dev server.
- `mobile local browser` usually means hosting from the desktop over LAN or deploying a local/static build; a phone's `localhost` is the phone, not the desktop.
- PWA install/offline service workers require secure origins, except localhost during development.
- Third-party CraftPix/Cratpix and Daz assets need licensing review before redistribution.
""",
    )

    write_doc(
        "MOBILE_BETA_REQUIREMENTS.md",
        """
# Mobile Beta Requirements

## Required

- Responsive layout from 360px wide upward.
- Touch-first controls; no keyboard dependency.
- Large tap targets, preferably 44px or larger.
- Start new game and load game from browser storage.
- Persistent save data in browser storage.
- One complete playable mission path.
- Basic offline asset strategy after the vertical slice works.

## Browser/Device Notes

- Desktop local testing can use `http://localhost`.
- Phone testing needs either the phone opening a LAN URL for the dev server or a static/PWA deployment.
- Service workers do not work from `file://`.
- PWA installability generally needs HTTPS, except local development exceptions.

## Out Of Scope For First Beta

- Multiplayer.
- Arena lobby.
- Backend.
- Login/accounts.
- Unity WebGL.
- Full 8-world campaign.
""",
    )

    write_doc(
        "ASSET_AUDIT.md",
        f"""
# Asset Audit

Generated from `{ARCHIVE_ROOT}` with Unity `Library` cache excluded.

## Summary

- Total manifest assets: {len(assets)}
- Immediately usable without mandatory conversion: {len(immediate_assets)}
- Need conversion/optimization/review: {len(conversion_assets)}

## Strong Asset Areas

- `Assets/Battle/Battle`: battle UI and background material.
- `Assets/Arena`: lobby/room/zone UI reference, but multiplayer is out of scope.
- `Assets/Main Menu` and `Assets/Player Interface`: menu and HUD references.
- `Main_Characters`: character portraits and animation stills.
- `Camelot Animation Project`: many Unity/GIF animation references.
- `4Characters-for-Unity/Assets/Daz3D`: four Daz/Unity character models/prefabs and bridge material.

## Conversion Flags

- PSD files should be exported to optimized PNG/WebP.
- Large PNG/JPG/GIF files should be size-checked before mobile use.
- FBX/Daz/Unity assets are not directly browser-runtime assets for the React-first Beta.
- GIF animation should be reviewed for size/performance; sprite sheets or video may be better later.
- CraftPix/Cratpix and Daz assets need rights review before public distribution.
""",
    )

    (PROJECT_ROOT / "package.json").write_text(
        json.dumps(
            {
                "name": "camelot-legends-web",
                "private": True,
                "version": "0.0.1",
                "type": "module",
                "scripts": {
                    "dev": "vite",
                    "build": "tsc && vite build",
                    "preview": "vite preview",
                    "extract:phase1": "python tools/extract_phase1.py",
                    "validate:content": "node tools/validate-content.mjs",
                },
                "dependencies": {
                    "@vitejs/plugin-react": "^5.0.0",
                    "idb": "^8.0.0",
                    "react": "^19.0.0",
                    "react-dom": "^19.0.0",
                    "vite": "^7.0.0",
                },
                "devDependencies": {
                    "@types/react": "^19.0.0",
                    "@types/react-dom": "^19.0.0",
                    "typescript": "^5.0.0",
                },
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (PROJECT_ROOT / "README.md").write_text(
        """
# Camelot Legends Web

Non-Unity, web-first single-player rebuild workspace for Camelot Legends.

The historical archive is treated as read-only source material. Phase 1 extracts structured content and an asset manifest from the surviving files, then documents the first playable browser/mobile vertical slice.

## Phase 1 Commands

```powershell
python tools/extract_phase1.py
node tools/validate-content.mjs
```
""".strip()
        + "\n",
        encoding="utf-8",
    )

    print("Generated Phase 1 content and docs")
    print(doc_table_counts(outputs))


if __name__ == "__main__":
    main()
