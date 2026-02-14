# glint ✨

**Express emotional status on IoT displays via animated eyes & eyebrows**

A simple CLI tool for agents (and humans) to display emotions on a Tidbyt device. No frameworks, no magic - just pixels.

![neutral](assets/neutral.gif) ![happy](assets/happy.gif) ![sad](assets/sad.gif) ![angry](assets/angry.gif) ![surprised](assets/surprised.gif)

## Quick Start

```bash
# Clone and install
git clone https://github.com/sethgho/glint.git
cd glint
bun install

# List available emotions
bun run src/cli.ts list

# Preview an emotion (saves GIF to file)
bun run src/cli.ts show happy --preview /tmp/test.gif

# Push to Tidbyt
export TIDBYT_TOKEN=your_token
export TIDBYT_DEVICE_ID=your_device_id
bun run src/cli.ts show happy
```

## Emotions

| Emotion | Preview | Eyes | Eyebrows | Use Case |
|---------|---------|------|----------|----------|
| `neutral` | ![neutral](assets/neutral.gif) | normal | level | Idle, default state |
| `happy` | ![happy](assets/happy.gif) | slightly closed | raised | Success, good news |
| `sad` | ![sad](assets/sad.gif) | half-closed | droopy (outer down) | Errors, failures |
| `angry` | ![angry](assets/angry.gif) | wide, small pupils | furrowed (inner down) | Critical alerts |
| `surprised` | ![surprised](assets/surprised.gif) | wide open | raised high | Unexpected events |
| `worried` | ![worried](assets/worried.gif) | normal | slightly droopy | Warnings |
| `sleepy` | ![sleepy](assets/sleepy.gif) | nearly closed | level | Low activity, idle |
| `excited` | ![excited](assets/excited.gif) | wide, big pupils | raised | Important events |
| `confused` | ![confused](assets/confused.gif) | normal | slightly raised | Unclear input |
| `focused` | ![focused](assets/focused.gif) | normal, small pupils | slightly furrowed | Working, processing |

## CLI Reference

```bash
# Show an emotion on Tidbyt
glint show <emotion> [options]

Options:
  -t, --token <token>         Tidbyt API token (or TIDBYT_TOKEN env)
  -d, --device-id <id>        Tidbyt device ID (or TIDBYT_DEVICE_ID env)
  -i, --installation-id <id>  Installation ID (default: "glint")
  -p, --preview <path>        Save GIF preview instead of pushing

# List all emotions
glint list
```

## Architecture

No React, no Typlit, no frameworks. Just straightforward pixel manipulation:

```
emotions.ts    →    draw.ts    →    canvas.ts    →    GIF encoder    →    Tidbyt API
   (config)      (render logic)   (pixel buffer)      (encoding)          (push)
```

- **canvas.ts** - 64×32 RGBA buffer with `setPixel()`, `fillRect()`, `drawEye()`, `drawEyebrow()`
- **draw.ts** - Converts emotion config to pixel art
- **emotions.ts** - Defines the 10 emotions with eye/brow parameters
- **push.ts** - GIF encoding and Tidbyt API integration

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TIDBYT_TOKEN` | Your Tidbyt API token |
| `TIDBYT_DEVICE_ID` | Your Tidbyt device ID |

Get these from the Tidbyt mobile app under Settings → General → Get API Key.

## For Agents

This tool is designed for AI agents to express their emotional state on a physical display. Example usage patterns:

```bash
# Starting a task
glint show focused

# Task completed successfully  
glint show happy

# Error encountered
glint show worried

# Critical failure
glint show angry

# Idle/waiting
glint show neutral
```

See [SKILL.md](SKILL.md) for the full agent skill specification.

## Development

```bash
# Install dependencies
bun install

# Test rendering (preview mode)
bun run src/cli.ts show happy --preview /tmp/test.gif

# Run tests
bun run src/cli.ts list
```

## License

MIT
