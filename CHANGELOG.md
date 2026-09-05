# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-05

### Minor
- Add GitHub optimization, CI, license, changelog, and issue templates

## [1.2.0] - 2026-09-05

### Added

- GitHub README badges for npm, Node.js, license, and downloads
- Comparison table against `npm version`, `bumpp`, and `release-it`
- Optimized npm package description and keywords

### Changed

- Improved repository discoverability with topics and refined keywords

## [1.1.0] - 2026-08-31

### Added

- `--changelog` flag to prepend release entries to `CHANGELOG.md`
- `--dry-run` mode to preview the full release pipeline
- Interactive mode when run without a type argument

### Changed

- Improved pre-flight checks for `origin` remote validation

## [1.0.0] - 2026-08-24

### Added

- Semver bump (`p`, `mi`, `ma`)
- Build metadata injection (`buildNumber`, `buildEpoch`, `gitHash`, `gitCommitEpoch`)
- Git commit, tag, and push support
- Zero dependencies
- ESM module support
