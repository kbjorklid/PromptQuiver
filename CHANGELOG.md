# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-04-06

### Added
- **Global Search:** Search across all project YAML files (`Shift+G`).
- **Paste Support:** Implement paste shortcut (`p` / `Ctrl+V`) for prompts and notes.
- **Copy Shortcut:** Added `c` as an alternative copy shortcut to `y`.
- **Testing:** Implemented Page Object Model (POM) for integration tests to improve reliability and readability.

### Changed
- **Tab Reordering:** New tab sequence: Prompts, Canned, Notes, Snippets, Archive, Settings.
- **UI Labels:** Renamed "Yank" to "Copy" in the footer and help hints.

### Fixed
- **Viewport:** Dynamically calculate viewport size to fully utilize terminal height.
- **Test Stability:** Resolved flakiness in archive-related integration tests.

## [0.2.3] - 2026-04-05

### Fixed
- Improved viewport calculation logic.
- Added word-wise movement (`Ctrl + Left/Right`) to text editors.

## [0.2.0] - 2026-04-05

### Added
- Claude Code slash command suggestions toggle in settings.
- Centralized feedback and clipboard operations.

### Changed
- Refined TUI elements, spacing, and labels.

[0.3.0]: https://github.com/kbjorklid/PromptQuiver/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/kbjorklid/PromptQuiver/compare/v0.2.2...v0.2.3
[0.2.0]: https://github.com/kbjorklid/PromptQuiver/compare/v0.1.6...v0.2.0
