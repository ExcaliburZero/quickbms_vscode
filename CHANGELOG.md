# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- Language server not dowloading and running on Windows.

## [0.1.0] - 2021-05-18
### Added
- Language server support (version 0.1.0).
- Setting to enable/disable language server.
- Setting to change language server version.
- Setting to use specific language server binary.

## [0.0.2] - 2021-04-18
### Added
- Syntax highlighting for block comments.
- Auto-closing pair logic for strings and square brackets (`""`, `[]`).
- More information to the `package.json` file.

### Changed
- Default line comment symbol from `//` to `#`.
- Package display name and description in `package.json`.

### Removed
- Non-applicable bracket rules in language configuration.

## [0.0.1] - 2021-04-17
### Added
- Some incomplete syntax highlighting support.