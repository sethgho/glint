# Changelog

## 0.3.0

### Added
- **Multi-provider AI generation** — `glint generate` now supports Claude Code, OpenAI Codex, OpenCode CLI, and direct Anthropic API as backends (`--provider`)
- **`--overwrite` flag** for `glint generate` — prevents accidental overwrites of existing styles
- **Spinner progress indicator** — replaces dot-spam during long LLM generation calls
- **Safe zone enforcement** — generated SVGs keep all elements within y=3–29 to prevent clipping on small displays
- **Community registry** — `glint auth`, `glint style search/install/publish` for sharing styles

### Fixed
- LLM provider timeouts bumped from 180s to 600s to handle complex style generation
- ANSI escape stripping for Claude Code CLI output

### Changed
- Default generation timeout increased to 10 minutes per provider

## 0.2.0

### Added
- SVG-based style system with scalable emotions
- Built-in styles: kawaii, cyberpunk, retro, spooky, minimal
- `glint validate` for style validation
- `glint style init` scaffolding
- Config file support (`~/.config/glint/config.json`)

## 0.1.0

- Initial release with programmatic eye rendering
- 10 emotions, Tidbyt push support
