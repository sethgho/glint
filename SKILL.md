---
name: glint
description: >
  Express emotional status on Tidbyt displays via eyes & eyebrows.

  TRIGGER THIS SKILL WHEN:
  - Agent wants to express their current emotional state visually
  - User asks to show an emotion on the Tidbyt
  - Agent needs to signal status (happy = success, worried = alert, focused = working, etc.)
  - Creating ambient awareness of agent activity/mood

  DON'T USE THIS SKILL WHEN:
  - Displaying complex information (use typlit for full apps)
  - Need detailed text or charts
  - Just pushing a static image (use tidbyt skill)

  This skill is for emotional expression via eyes/eyebrows only.
---

# glint

**Express emotional status on IoT displays via eyes & eyebrows**

## Installation

```bash
# Clone and install
git clone git@github.com:sethgho/glint.git
cd glint
bun install

# Set environment variables
export TIDBYT_TOKEN=your_token
export TIDBYT_DEVICE_ID=your_device_id
```

## Usage

### List Available Emotions

```bash
bun run src/cli.ts list
```

### Display an Emotion

```bash
# Using environment variables
bun run src/cli.ts show happy

# Using command-line flags
bun run src/cli.ts show worried --token xxx --device-id yyy

# With custom installation ID
bun run src/cli.ts show excited --installation-id my-glint
```

## Available Emotions

Each emotion is defined by eye openness, eyebrow angle/height, and pupil size:

| Emotion   | Use Case                                    |
|-----------|---------------------------------------------|
| neutral   | Default state, idle, calm                   |
| happy     | Task completed successfully                 |
| sad       | Error or failure                            |
| angry     | Critical error, system issue                |
| surprised | Unexpected result                           |
| worried   | Warning, potential issue                    |
| sleepy    | Low activity, power-saving mode             |
| excited   | High activity, important event              |
| confused  | Unclear input, needs clarification          |
| focused   | Working on a task, processing               |

## Agent Workflow

1. **Determine emotion** - Map agent state to an emotion
2. **Execute CLI** - Run `bun run src/cli.ts show <emotion>`
3. **Confirm** - CLI will output success message

## Example Agent Use Cases

### Task Status Updates

```bash
# Starting work
bun run src/cli.ts show focused

# Task completed successfully
bun run src/cli.ts show happy

# Error encountered
bun run src/cli.ts show worried
```

### Ambient Awareness

```bash
# Idle state
bun run src/cli.ts show neutral

# Active processing
bun run src/cli.ts show focused

# Waiting for user input
bun run src/cli.ts show sleepy
```

### Event Notifications

```bash
# Important event detected
bun run src/cli.ts show excited

# Unexpected data
bun run src/cli.ts show surprised

# Critical alert
bun run src/cli.ts show angry
```

## Environment Variables

**Required:**
- `TIDBYT_TOKEN` - Tidbyt API token
- `TIDBYT_DEVICE_ID` - Tidbyt device ID

**Optional:**
- Installation ID can be specified via `--installation-id` flag (default: `glint`)

## Technical Details

- **Display**: 64x32 pixel Tidbyt display
- **Rendering**: Typlit (TypeScript/JSX)
- **Format**: PNG pushed via Tidbyt API
- **Positioning**: Two eyes with eyebrows, centered on display

## Troubleshooting

### "Missing env TIDBYT_TOKEN"
Set the required environment variables or use CLI flags.

### "Unknown emotion: xyz"
Run `bun run src/cli.ts list` to see available emotions.

### "Tidbyt push failed"
Check API token and device ID validity. Ensure network connectivity.

## Roadmap

Future enhancements planned:
- Multiple art styles (pixel, realistic, cartoon)
- Animation support (blinking, eye movement)
- More granular emotion parameters
- Support for other IoT displays beyond Tidbyt
