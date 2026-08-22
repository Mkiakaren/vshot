# vshot

**Bump semver, inject build metadata, and auto-commit — in one command.**

`vshot` is a small CLI for projects that want versioning, build information, and Git commits handled together.

```bash
vshot p "fix login bug"
```

This bumps:

```text
1.2.3 → 1.2.4
```

and creates the commit:

```text
1.2.4: fix login bug
```

## Installation

### Global installation

Install `vshot` globally:

```bash
npm install -g vshot
```

After installation, use it directly in any project:

```bash
vshot p "fix login bug"
vshot mi "add dark mode"
vshot ma "rewrite core engine"
```

### Local installation

Install `vshot` as a development dependency:

```bash
npm install -D vshot
```

Then add a script to your project's `package.json`:

```json
{
  "scripts": {
    "v": "vshot"
  }
}
```

For example:

```bash
npm run v p "fix login bug"
```

The same command works with other package managers:

```bash
pnpm v p "fix login bug"
yarn v p "fix login bug"
```

## Usage

```bash
vshot <type> "<message>"
```

### Version types

| Type | Bump  | Example           |
| ---- | ----- | ----------------- |
| `p`  | Patch | `1.2.3` → `1.2.4` |
| `mi` | Minor | `1.2.3` → `1.3.0` |
| `ma` | Major | `1.2.3` → `2.0.0` |

For example:

```bash
vshot p  "fix login bug"
vshot mi "add dark mode"
vshot ma "rewrite core engine"
```

The message is used as the Git commit message.

For example:

```text
1.3.0: add dark mode
```

## What it does

### 1. Bumps the version

`vshot` reads the current version from `package.json` and applies the requested semver bump.

### 2. Adds build metadata

`vshot` adds or updates `buildInfo` in `package.json`:

```json
{
  "buildInfo": {
    "buildNumber": "260823.0110",
    "buildEpoch": "1787429400",
    "gitHash": "b1d887f",
    "gitCommitEpoch": "1787429000"
  }
}
```

The fields are:

| Field            | Description                              |
| ---------------- | ---------------------------------------- |
| `buildNumber`    | Build date and time in `YYMMDD.HHmm` UTC |
| `buildEpoch`     | Build timestamp as Unix time             |
| `gitHash`        | Short hash of the current `HEAD` commit  |
| `gitCommitEpoch` | Timestamp of the current `HEAD` commit   |

### 3. Creates the Git commit

`vshot` automatically stages and commits the changes.

Its staging behavior is:

**When files are already staged**

Only the existing staged changes and `package.json` are committed.

**When nothing is staged**

`vshot` stages all changes and commits them together with `package.json`.

This lets you choose whether the commit should contain only selected changes or the entire working tree.

## Example

Suppose the current version is:

```json
{
  "version": "1.2.3"
}
```

Run:

```bash
vshot mi "add dark mode"
```

`vshot` will:

1. Change the version to `1.3.0`
2. Add the build metadata
3. Stage the required files
4. Create a commit with:

```text
1.3.0: add dark mode
```

Example output:

```text
[vshot] 1.2.3 → 1.3.0
[vshot] Build: [260823.0110] Hash: [b1d887f]
[vshot] No staged changes → staging everything.
[main 2349338] 1.3.0: add dark mode
 8 files changed, 212 insertions(+), 30 deletions(-)
[vshot] Committed: "1.3.0: add dark mode"
```

## Git

Git is used to read build information and create the commit.

If Git metadata cannot be read, `vshot` falls back to:

```json
{
  "gitHash": "no-git",
  "gitCommitEpoch": "0"
}
```

The version and build metadata are still updated, but creating the commit requires Git.

## Requirements

- Node.js `>= 18`
- Git for automatic commits

## License

MIT
