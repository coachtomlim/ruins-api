# Fable 5 Roguelike Handoff Package

This folder is a portable handoff package for creating the new `fiends-hero-roguelike` repository.

## Start Here

1. Read `CANON_LOCK.md`.
2. Read `NEW_REPO_BOOTSTRAP.md`.
3. Paste `FABLE5_MASTER_PROMPT.md` into Fable 5.
4. Use `docs/FH_ALPHA_MODULE_001_MANIFEST.md` to map Alpha content into Module 001.
5. Use `docs/FH_ROGUELIKE_ACCEPTANCE_CRITERIA.md` as the implementation gate.

## Contents

- `audit/`: candidate audit, spike report, and isolated two-room spike.
- `alpha-content/`: Alpha SSOT JSON plus route/navigation files.
- `engine-reference/`: current deterministic engine, walkthrough scripts, validators, and tests.
- `canon/`: canon notes and known conflicts.
- `docs/`: copied handoff docs and architecture/schema references.
- `CANON_LOCK.md`: non-negotiable canon preservation rules.
- `NEW_REPO_BOOTSTRAP.md`: new repo setup instructions.
- `FABLE5_MASTER_PROMPT.md`: paste-ready autonomous implementation prompt.

## Boundary

This package is preparation only. Do not implement the roguelike inside `ruins-api`.
