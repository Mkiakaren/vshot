# vshot

Bump semver, inject build metadata, and auto-commit — in one command.

## Install

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

## Usage

```bash
pnpm v p "fix login bug"       # 1.2.3 → 1.2.4
pnpm v mi "add dark mode"      # 1.2.3 → 1.3.0
pnpm v ma "rewrite core"       # 1.2.3 → 2.0.0
```

| Argument | Type  | Example          |
| -------- | ----- | ---------------- |
| `p`      | patch | bug fixes        |
| `mi`     | minor | new features     |
| `ma`     | major | breaking changes |

## What it does

1. Bumps the version in `package.json`
2. Injects `buildInfo` into `package.json`:

```json
"buildInfo": {
  "buildNumber": "260822.1430",
  "buildEpoch":  "1724330400",
  "gitHash":     "74b86cf",
  "gitCommitEpoch": "1724330000"
}
```

3. Stages and commits automatically:
   - If you have pre-staged files → commits only those + `package.json`
   - If nothing is staged → stages everything and commits

Commit message format: `1.3.0: your message here`

## Requirements

- Node.js >= 18
- Git (optional — falls back to `no-git` if unavailable)

## License

MIT
