# glint ✨

**Express emotional status on IoT displays via eyes & eyebrows**

A CLI tool for agents (and humans) to display emotions on a Tidbyt device using animated eyes and eyebrows.

## Quick Start

```bash
# Install dependencies
bun install

# List available emotions
bun run src/cli.ts list

# Show an emotion
TIDBYT_TOKEN=your_token TIDBYT_DEVICE_ID=your_device_id \
  bun run src/cli.ts show happy

# Or with flags
bun run src/cli.ts show happy --token xxx --device-id yyy
```

## Available Emotions

- `neutral` - Default calm state
- `happy` - Cheerful, eyes slightly closed
- `sad` - Downturned eyebrows, smaller pupils
- `angry` - Furrowed brows, intense gaze
- `surprised` - Wide eyes, raised eyebrows
- `worried` - Slightly furrowed brows
- `sleepy` - Half-closed eyes
- `excited` - Wide eyes, raised eyebrows, large pupils
- `confused` - Slightly raised brow
- `focused` - Concentrated gaze, slightly furrowed

## Requirements

- Bun runtime
- Tidbyt API token
- Tidbyt device ID

## Environment Variables

- `TIDBYT_TOKEN` - Your Tidbyt API token
- `TIDBYT_DEVICE_ID` - Your Tidbyt device ID

## Development

```bash
# Run CLI directly
bun run src/cli.ts show happy

# Build for distribution
bun run build
```

## Architecture

- **Emotions** (`src/emotions.ts`) - Emotion definitions with eye/eyebrow parameters
- **Renderer** (`src/renderer.tsx`) - Typlit-based rendering of eyes/eyebrows
- **Push** (`src/push.ts`) - Tidbyt API integration
- **CLI** (`src/cli.ts`) - Command-line interface

## Roadmap

- [ ] Multiple art styles (pixel, realistic, cartoon)
- [ ] More granular emotion parameters
- [ ] Animation support (blinking, looking around)
- [ ] Support for other IoT displays
- [ ] Voice/sound integration

## License

MIT
