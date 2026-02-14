---
name: glint
description: >
  Express emotional status on Tidbyt displays via animated eyes & eyebrows.

  TRIGGER THIS SKILL WHEN:
  - Agent wants to express their current emotional state visually
  - User asks to show an emotion on the Tidbyt
  - Agent needs to signal status (happy = success, worried = alert, focused = working)
  - Creating ambient awareness of agent activity/mood

  DON'T USE THIS SKILL WHEN:
  - Displaying text, charts, or complex information → use typlit
  - Just pushing a static image file → use tidbyt skill directly
  - Need animations beyond static eyes → future glint feature

  For emotional expression via eyes/eyebrows only.
---

# glint

**Express emotional status on IoT displays via eyes & eyebrows**

![neutral](assets/neutral.gif) ![happy](assets/happy.gif) ![angry](assets/angry.gif) ![sad](assets/sad.gif) ![surprised](assets/surprised.gif)

## Quick Start

```bash
cd /path/to/glint
export TIDBYT_TOKEN=your_token
export TIDBYT_DEVICE_ID=your_device_id

# Show an emotion
bun run src/cli.ts show happy
```

## Available Emotions

| Emotion | Preview | Description | Agent Use Case |
|---------|---------|-------------|----------------|
| `neutral` | ![](assets/neutral.gif) | Calm, default state | Idle, waiting |
| `happy` | ![](assets/happy.gif) | Pleased, content | Task success |
| `sad` | ![](assets/sad.gif) | Disappointed | Task failure |
| `angry` | ![](assets/angry.gif) | Frustrated, alert | Critical error |
| `surprised` | ![](assets/surprised.gif) | Startled, amazed | Unexpected result |
| `worried` | ![](assets/worried.gif) | Concerned | Warning state |
| `sleepy` | ![](assets/sleepy.gif) | Tired, low energy | Low activity |
| `excited` | ![](assets/excited.gif) | Eager, energetic | Important event |
| `confused` | ![](assets/confused.gif) | Uncertain | Needs clarification |
| `focused` | ![](assets/focused.gif) | Concentrated | Working on task |

## Usage Patterns

### Task Status

```bash
# Starting work
bun run src/cli.ts show focused

# Success
bun run src/cli.ts show happy

# Error
bun run src/cli.ts show worried

# Critical failure
bun run src/cli.ts show angry
```

### Ambient Presence

```bash
# Idle state
bun run src/cli.ts show neutral

# Active processing
bun run src/cli.ts show focused

# Waiting for input
bun run src/cli.ts show sleepy
```

### Event Reactions

```bash
# Something exciting happened
bun run src/cli.ts show excited

# Unexpected data
bun run src/cli.ts show surprised

# Something went wrong
bun run src/cli.ts show sad
```

## CLI Options

```bash
bun run src/cli.ts show <emotion> [options]

Arguments:
  emotion                     One of: neutral, happy, sad, angry, surprised,
                              worried, sleepy, excited, confused, focused

Options:
  -t, --token <token>         Tidbyt API token (or TIDBYT_TOKEN env)
  -d, --device-id <id>        Tidbyt device ID (or TIDBYT_DEVICE_ID env)  
  -i, --installation-id <id>  Tidbyt installation ID (default: "glint")
  -p, --preview <path>        Save GIF to file instead of pushing
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TIDBYT_TOKEN` | Yes | Tidbyt API token |
| `TIDBYT_DEVICE_ID` | Yes | Tidbyt device ID |

## Preview Mode

Test rendering without pushing to device:

```bash
bun run src/cli.ts show angry --preview /tmp/test.gif
# Then view /tmp/test.gif
```

## Troubleshooting

**"Missing TIDBYT_TOKEN"**  
Set environment variables or use --token and --device-id flags.

**"Unknown emotion: xyz"**  
Run `bun run src/cli.ts list` to see valid emotions.

**"Tidbyt push failed: 401"**  
Check your API token is valid and not expired.

## Technical Details

- **Display**: 64×32 pixels (Tidbyt native resolution)
- **Format**: GIF (single frame)
- **No dependencies on React/Typlit** - raw pixel manipulation
- **Architecture**: emotions.ts → draw.ts → canvas.ts → GIF → API
