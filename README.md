# glint ✨

**Express emotional status on IoT displays via animated eyes & eyebrows**

A CLI tool for AI agents (and humans) to display emotions on a Tidbyt device. No frameworks, no magic - just pixels.

![neutral](assets/neutral.gif) ![happy](assets/happy.gif) ![sad](assets/sad.gif) ![angry](assets/angry.gif) ![surprised](assets/surprised.gif)

---

## For Humans

### Installation

```bash
# Clone and install
git clone https://github.com/sethgho/glint.git
cd glint
bun install

# Build (optional, for global install)
bun run build
```

### Setup

1. Get your Tidbyt API credentials from the Tidbyt mobile app:
   - Open Settings → General → Get API Key
   - Copy your **API Token** and **Device ID**

2. Set environment variables:
```bash
export TIDBYT_TOKEN=your_token_here
export TIDBYT_DEVICE_ID=your_device_id_here
```

### Usage

```bash
# List available emotions
bun run src/cli.ts list

# Show an emotion on your Tidbyt
bun run src/cli.ts show happy

# Preview without pushing (saves GIF)
bun run src/cli.ts show happy --preview /tmp/test.gif

# Use programmatic style instead of AI-generated
bun run src/cli.ts show happy --style default

# List available styles
bun run src/cli.ts styles
```

### CLI Reference

```bash
glint show <emotion> [options]

Options:
  -s, --style <style>         Visual style (ai-v1, default)
  -t, --token <token>         Tidbyt API token (or TIDBYT_TOKEN env)
  -d, --device-id <id>        Tidbyt device ID (or TIDBYT_DEVICE_ID env)
  -i, --installation-id <id>  Installation ID (default: "glint")
  -p, --preview <path>        Save GIF preview instead of pushing

glint list                    List available emotions
glint styles                  List available visual styles
```

---

## For AI Agents

glint is designed for AI agents to express their emotional/cognitive state on a physical display, giving humans visibility into the agent's current state.

### Quick Start

1. **Install glint** in your workspace:
```bash
git clone https://github.com/sethgho/glint.git /path/to/workspace/glint
cd /path/to/workspace/glint
bun install
```

2. **Add the skill** to your agent configuration by referencing `SKILL.md`:
```
/path/to/workspace/glint/SKILL.md
```

3. **Document in your TOOLS.md** (or equivalent):
```markdown
## Tidbyt Status Display
- **Tool:** glint at /path/to/glint
- **Usage:** `cd /path/to/glint && bun run src/cli.ts show <emotion>`
- **Emotions:** neutral, happy, sad, angry, surprised, worried, sleepy, excited, confused, focused
- **Update when:** State changes significantly (task start, completion, errors, discoveries)
```

4. **Add to your memory/guidance** to update proactively:
```markdown
Update the Tidbyt display when my cognitive/emotional state changes.
```

### When to Update

| Situation | Emotion |
|-----------|---------|
| Starting a task | `focused` or `neutral` |
| Task completed successfully | `happy` or `excited` |
| Error encountered | `worried` or `confused` |
| Critical failure / frustration | `angry` |
| Unexpected discovery | `surprised` |
| Waiting / idle | `neutral` or `sleepy` |

### Full Skill Documentation

See **[SKILL.md](SKILL.md)** for complete agent integration instructions including:
- Skill trigger conditions
- State transition examples
- Proactive update guidelines
- Credential management
- Troubleshooting

---

## Emotions

| Emotion | Eyes | Eyebrows | Use Case |
|---------|------|----------|----------|
| `neutral` | normal | level | Idle, default state |
| `happy` | slightly closed | raised | Success, good news |
| `sad` | half-closed | droopy | Errors, failures |
| `angry` | wide, small pupils | furrowed | Critical alerts, frustration |
| `surprised` | wide open | raised high | Unexpected events |
| `worried` | normal | slightly droopy | Warnings, uncertainty |
| `sleepy` | nearly closed | level | Low activity, idle |
| `excited` | wide, big pupils | raised | Important events, breakthroughs |
| `confused` | normal | slightly raised | Unclear input |
| `focused` | normal, small pupils | slightly furrowed | Working, processing |

## Styles

| Style | Description |
|-------|-------------|
| `ai-v1` | AI-generated cartoon eyes (default) |
| `default` | Programmatic simple eyes with eyebrows |

The display shows the emotion name as a label below the eyes for easier interpretation.

## Architecture

No React, no Typlit, no frameworks. Just straightforward pixel manipulation:

```
emotions.ts    →    draw.ts    →    canvas.ts    →    GIF encoder    →    Tidbyt API
   (config)      (render logic)   (pixel buffer)      (encoding)          (push)

styles.ts      →    assets/     →    sharp        →    GIF encoder    →    Tidbyt API
  (style mgmt)    (AI images)     (compositing)       (encoding)          (push)
```

- **canvas.ts** - 64×32 RGBA buffer with pixel drawing primitives
- **draw.ts** - Converts emotion config to pixel art (programmatic style)
- **emotions.ts** - Defines the 10 emotions with eye/brow parameters
- **styles.ts** - Manages visual styles (programmatic vs image-based)
- **pixelfont.ts** - Crisp 3×5 pixel font for LED displays
- **push.ts** - GIF encoding and Tidbyt API integration

## Development

```bash
# Install dependencies
bun install

# Test rendering (preview mode)
bun run src/cli.ts show happy --preview /tmp/test.gif

# Build for distribution
bun run build

# List emotions/styles
bun run src/cli.ts list
bun run src/cli.ts styles
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TIDBYT_TOKEN` | Your Tidbyt API token |
| `TIDBYT_DEVICE_ID` | Your Tidbyt device ID |

## License

MIT
