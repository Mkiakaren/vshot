# vshot

[![npm](https://img.shields.io/npm/v/vshot.svg)](https://www.npmjs.com/package/vshot)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Downloads](https://img.shields.io/npm/dm/vshot.svg)](https://www.npmjs.com/package/vshot)

**The tiny release CLI for Node.js.**

Version + build metadata + Git release in one command.

```bash
npm install -g vshot
```

```bash
vshot p "fix auth bug"
```

```text
1.2.3 → 1.2.4

✓ package.json
✓ build metadata
✓ git commit
✓ git tag
✓ git push
✓ changelog
```

---

## Installation

### Global

```bash
npm install -g vshot
```

```bash
vshot p "fix login bug"
```

### Local

```bash
npm install -D vshot
```

```json
{
  "scripts": {
    "v": "vshot"
  }
}
```

```bash
npm run v p "fix login bug"
pnpm v  p "fix login bug"
yarn v  p "fix login bug"
```

---

## Why vshot?

If `npm version` is too basic and `release-it` is too much, vshot gives you a tiny release workflow with build metadata. No config file, no plugins, no dependencies.

- **Zero dependencies** — just Node.js and Git
- **Build metadata** — `buildNumber`, `buildEpoch`, `gitHash`, and `gitCommitEpoch` injected into `package.json`
- **Git workflow** — commit, tag, and push in one command
- **Changelog** — auto-prepend release entries to `CHANGELOG.md`
- **Dry run** — preview every step before writing
- **Interactive mode** — prompts when run without arguments

## vshot vs alternatives

| Feature           | vshot | npm version | bumpp | release-it |
| ----------------- | ----: | ----------: | ----: | ---------: |
| Semver bump       |     ✓ |           ✓ |     ✓ |          ✓ |
| Build metadata    |     ✓ |           — |     — |          — |
| Git commit        |     ✓ |           ✓ |     ✓ |          ✓ |
| Tag               |     ✓ |           ✓ |     ✓ |          ✓ |
| Push              |     ✓ |           — |     ✓ |          ✓ |
| Changelog         |     ✓ |           — |     — |          ✓ |
| Zero dependencies |     ✓ |           — |    ✓? |          — |
| Tiny CLI          |     ✓ |           — |     — |          — |

---

## Usage

```bash
vshot <type> "<message>" [flags]
```

### Version Types

| Type | Bump  | Example           |
| ---- | ----- | ----------------- |
| `p`  | Patch | `1.2.3` → `1.2.4` |
| `mi` | Minor | `1.2.3` → `1.3.0` |
| `ma` | Major | `1.2.3` → `2.0.0` |

### Flags

| Flag            | Description                               |
| --------------- | ----------------------------------------- |
| `--tag`         | Create an annotated Git tag (`vX.Y.Z`)    |
| `--push`        | Push commit and tag to `origin`           |
| `--no-commit`   | Skip all Git operations                   |
| `--changelog`   | Prepend a release entry to `CHANGELOG.md` |
| `--dry-run`     | Preview everything without writing        |
| `-v, --version` | Print vshot version                       |
| `-h, --help`    | Show help screen                          |

---

## Interactive Mode

If you run `vshot` without a type argument, it enters interactive mode and prompts you:

```bash
vshot
```

```text
  No type given — interactive mode

  Bump type (ma/mi/p) → p
  Commit message → fix null pointer in auth
```

---

## What It Does

### 1. Bumps the Version

Reads `package.json`, applies the semver bump, and writes it back.

### 2. Injects Build Metadata

Adds or updates `buildInfo` in `package.json`:

```json
{
  "buildInfo": {
    "buildNumber": "260831.1420",
    "buildEpoch": "1787429400",
    "gitHash": "b1d887f",
    "gitCommitEpoch": "1787429000"
  }
}
```

| Field            | Description                              |
| ---------------- | ---------------------------------------- |
| `buildNumber`    | Build date and time in `YYMMDD.HHmm` UTC |
| `buildEpoch`     | Build timestamp as Unix time             |
| `gitHash`        | Short hash of the current `HEAD`         |
| `gitCommitEpoch` | Timestamp of the current `HEAD` commit   |

### 3. Commits

Stages and commits changes automatically.

| Scenario             | Behavior                                       |
| -------------------- | ---------------------------------------------- |
| Nothing staged       | Stages everything and commits                  |
| Files already staged | Commits only the staged files + `package.json` |
| `--changelog` active | Also stages `CHANGELOG.md`                     |
| `--no-commit`        | Writes files only — no Git operations          |

### 4. Tags

`--tag` creates an annotated Git tag:

```bash
vshot mi "add dark mode" --tag
```

```text
Annotated tag  v1.3.0
```

If the tag already exists, it is skipped with a warning instead of failing.

### 5. Push

`--push` pushes the branch and (if `--tag` is set) the tag to `origin`:

```bash
vshot mi "add dark mode" --tag --push
```

Requires a remote named `origin`. vshot validates this during pre-flight checks and exits early if it is missing.

### 6. Changelog

`--changelog` prepends a release entry to `CHANGELOG.md` (created if it does not exist):

```bash
vshot mi "add dark mode" --changelog
```

```md
## [1.3.0] - 2026-08-31

### Minor

- Add dark mode
```

New entries are always inserted above existing entries, preserving history.

### 7. Dry Run

`--dry-run` runs the entire pipeline and prints every step without writing anything to disk or Git:

```bash
vshot ma "rewrite core" --tag --push --changelog --dry-run
```

```text
  DRY RUN — nothing will be written

  [1/6] Pre-flight checks
     ✓ package.json  v1.2.3
     ✓ Git  main @ b1d887f

  [2/6] Computing version bump
     build:  major  1.2.3 → 2.0.0

  [3/6] Writing package.json  [dry-run]
     ✓ version   1.2.3 → 2.0.0

  [4/6] Updating CHANGELOG.md  [dry-run]
     ✓ [2.0.0] entry prepended  2026-08-31

  [5/6] Committing changes  [dry-run]
     ✓ Would commit: "2.0.0: Rewrite core"

  [6/6] Creating annotated tag  [dry-run]
     ✓ Would create annotated tag v2.0.0
```

---

## Pre-flight Checks

Before writing anything, vshot validates:

- `package.json` exists and contains a valid semver `version`
- Git is available and reports the current branch and hash
- The working tree state (dirty/clean) is displayed
- A remote named `origin` exists when `--push` is used

---

## npm Lifecycle Hooks

If `package.json` defines `preversion` or `postversion` scripts, vshot runs them automatically at the appropriate points (skipped in `--dry-run` mode).

---

## Examples

```bash
vshot p  "fix auth null pointer"
vshot mi "add dark mode" --tag --push
vshot ma "rewrite core" --tag --push --changelog
vshot p  "test change" --dry-run
vshot mi "bump deps" --no-commit
```

---

## Git Fallback

If Git is not available, `gitHash` and `gitCommitEpoch` fall back to safe defaults:

```json
{
  "gitHash": "no-git",
  "gitCommitEpoch": "0"
}
```

The version bump and `buildInfo` are still written. Git operations (`--tag`, `--push`, commit) are silently disabled.

---

## Requirements

- Node.js `>= 18`
- Git for commit, tag, and push operations

---

## License

MIT
