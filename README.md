# vshot

Bump semver, inject build metadata, and auto-commit — in one command.

```bash
vshot p "fix login bug"   # 1.2.3 → 1.2.4
```

---

## Install

### Global (recommended)

Install once, use in any project:

```bash
npm install -g vshot
```

### Local (per project)

```bash
npm install -D vshot
```

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "v": "vshot"
  }
}
```

Then use:

```bash
npm run v p "fix login bug"
pnpm v p "fix login bug"
```

---

## Usage

```bash
vshot <type> "<message>"
```

| Type | Bump   | Example result     |
|------|--------|--------------------|
| `p`  | patch  | `1.2.3` → `1.2.4` |
| `mi` | minor  | `1.2.3` → `1.3.0` |
| `ma` | major  | `1.2.3` → `2.0.0` |

```bash
vshot p  "fix login bug"
vshot mi "add dark mode"
vshot ma "rewrite core engine"
```

---

## What it does

**1. Bumps the version** in your project's `package.json`

**2. Injects build metadata** into `package.json`:

```json
"buildInfo": {
  "buildNumber": "260822.1430",
  "buildEpoch": "1724330400",
  "gitHash": "74b86cf",
  "gitCommitEpoch": "1724330000"
}
```

| Field            | Description                        |
|------------------|------------------------------------|
| `buildNumber`    | `YYMMDD.HHmm` (UTC)                |
| `buildEpoch`     | Unix timestamp of the build        |
| `gitHash`        | Short SHA of the previous commit   |
| `gitCommitEpoch` | Unix timestamp of the last commit  |

**3. Stages and commits** with smart detection:

- If you have **pre-staged files** → commits only those + `package.json`
- If **nothing is staged** → stages everything and commits

Commit message format:

```
1.3.0: your message here
```

---

## Example output

```
[vshot] 1.2.3 → 1.3.0
[vshot] Build: [260822.1430] Hash: [74b86cf]
[vshot] No staged changes → staging everything.
[main 2349338] 1.3.0: add dark mode
  8 files changed, 212 insertions(+), 30 deletions(-)
[vshot] Committed: "1.3.0: add dark mode"
```

---

## Requirements

- Node.js >= 18
- Git (optional — falls back gracefully if unavailable)

---

## License

MIT