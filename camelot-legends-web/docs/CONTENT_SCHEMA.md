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
