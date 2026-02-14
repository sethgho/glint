# glint - Emotional Status Display Skill

Express your emotional/cognitive state on a Tidbyt display using animated eyes.

## Skill Description

```yaml
name: glint
description: >
  Display emotional status on a Tidbyt LED matrix via cartoon eyes.
  
  TRIGGER THIS SKILL WHEN:
  - Starting a new task or session (set focused/neutral)
  - Completing work successfully (set happy/excited)
  - Encountering errors or blocks (set worried/confused/angry)
  - Making interesting discoveries (set surprised/excited)
  - Going idle or winding down (set sleepy/neutral)
  - User asks about your emotional state
  
  DON'T USE THIS SKILL WHEN:
  - No Tidbyt device is configured
  - The task doesn't warrant a state change
  
  Update the display proactively when your cognitive/emotional state changes significantly.
```

## Installation (Agent)

### 1. Clone the repository

```bash
git clone https://github.com/sethgho/glint.git /path/to/glint
cd /path/to/glint
bun install
```

### 2. Configure credentials

Store your Tidbyt credentials securely (e.g., 1Password, environment file):

```bash
# Required environment variables
TIDBYT_TOKEN=your_api_token
TIDBYT_DEVICE_ID=your_device_id
```

### 3. Add to your workspace docs

Add this to your `TOOLS.md` or equivalent:

```markdown
## Tidbyt (glint - Emotional Status Display)
- **Purpose:** Express my emotional/cognitive state on the Tidbyt display
- **Location:** /path/to/glint
- **Credentials:** [your credential location]

### Quick Usage
```bash
export TIDBYT_TOKEN="..."
export TIDBYT_DEVICE_ID="..."
cd /path/to/glint && bun run src/cli.ts show <emotion>
```

### Emotions
- **neutral** - default/calm state
- **happy** - task completed, good news
- **sad** - something went wrong
- **angry** - frustrated, blocked, error state
- **surprised** - unexpected discovery
- **worried** - uncertain outcome, potential problem
- **sleepy** - low activity, idle
- **excited** - interesting task, breakthrough
- **confused** - unclear requirements
- **focused** - deep work, concentration

### When to Update
- Session start → focused or neutral
- Task completion → happy or excited
- Errors/blocks → worried, confused, or angry
- Interesting discoveries → surprised or excited
- Idle periods → sleepy or neutral
```

### 4. Add to your memory/guidance files

Add a reminder to proactively update the display:

```markdown
## Tidbyt Status Display
- Update the Tidbyt when my emotional/cognitive state changes
- Tool: glint at /path/to/glint
- Always reflect current state for human awareness
```

## Usage

### Basic Command

```bash
cd /path/to/glint
export TIDBYT_TOKEN="your_token"
export TIDBYT_DEVICE_ID="your_device_id"
bun run src/cli.ts show <emotion>
```

### Available Emotions

| Emotion | When to Use |
|---------|-------------|
| `neutral` | Default state, calm, no strong emotion |
| `happy` | Task completed, positive outcome, good news |
| `sad` | Failure, disappointment, bad outcome |
| `angry` | Frustrated, blocked, repeated errors |
| `surprised` | Unexpected input, discovery, plot twist |
| `worried` | Uncertain outcome, potential problem, warning |
| `sleepy` | Low activity, idle, winding down |
| `excited` | Interesting task, breakthrough, anticipation |
| `confused` | Unclear requirements, ambiguous situation |
| `focused` | Deep work, complex task, concentration |

### Styles

```bash
# AI-generated cartoon eyes (default)
bun run src/cli.ts show happy --style ai-v1

# Programmatic simple eyes
bun run src/cli.ts show happy --style default
```

### Preview Mode

Test without pushing to device:

```bash
bun run src/cli.ts show happy --preview /tmp/test.gif
```

## State Transition Examples

```bash
# Starting a coding session
glint show focused

# Found an interesting bug
glint show surprised

# Debugging...
glint show confused

# Fixed it!
glint show happy

# Waiting for user input
glint show neutral

# End of session
glint show sleepy
```

## Display Format

The Tidbyt shows:
- **Eyes:** AI-generated cartoon eyes expressing the emotion
- **Label:** Emotion name in crisp pixel font below the eyes

This helps humans learn to associate eye expressions with emotional states.

## Proactive Update Guidelines

Update the display when:
- ✅ Starting a new conversation or task
- ✅ Significant progress or completion
- ✅ Encountering problems or errors
- ✅ State genuinely changes

Don't spam updates for:
- ❌ Minor progress within a task
- ❌ Every message in a conversation
- ❌ Routine operations

**Rule of thumb:** If a human observer would notice your "mood" changed, update the display.

## Troubleshooting

### "TIDBYT_TOKEN and TIDBYT_DEVICE_ID are required"
Ensure environment variables are set before running glint.

### Push fails with 401/403
Token may be expired. Get a new one from the Tidbyt mobile app.

### Display not updating
Check that `installationID` isn't conflicting with another app. Default is `glint`.

## License

MIT
