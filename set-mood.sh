#!/usr/bin/env bash
# set-mood.sh — Update both Tidbyt (via glint) and Discord presence in one call
# Usage: ./set-mood.sh <emotion>
# Emotions: neutral, happy, sad, angry, surprised, worried, sleepy, excited, confused, focused

set -euo pipefail

EMOTION="${1:?Usage: set-mood.sh <emotion>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Emoji map for Discord status
declare -A EMOJI_MAP=(
  [neutral]="🪴"
  [happy]="😊"
  [sad]="😔"
  [angry]="😤"
  [surprised]="😲"
  [worried]="😟"
  [sleepy]="😴"
  [excited]="🤩"
  [confused]="🤔"
  [focused]="🎯"
)

EMOJI="${EMOJI_MAP[$EMOTION]:-🪴}"

# 1. Push to Tidbyt
export TIDBYT_TOKEN="${TIDBYT_TOKEN:-$(op item get 'Tidbyt Tokens' --vault Wilson --format json --reveal 2>/dev/null | jq -r '.fields[] | select(.id=="notesPlain") | .value' | grep TIDBYT_TOKEN | cut -d= -f2)}"
export TIDBYT_DEVICE_ID="${TIDBYT_DEVICE_ID:-wonderingly-cunning-humble-mynah-d57}"

cd "$SCRIPT_DIR"
bun run src/cli.ts show "$EMOTION" 2>&1 || echo "⚠️  Tidbyt push failed"

# 2. Update Discord bot presence via OpenClaw config patch
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
if command -v jq &>/dev/null && [ -f "$OPENCLAW_CONFIG" ]; then
  # Use openclaw config set for the activity field
  openclaw config set channels.discord.activity "\"$EMOJI $EMOTION\"" --json 2>/dev/null || true
  # Signal restart to pick up the change
  openclaw gateway restart 2>/dev/null || true
fi

echo "✅ Mood set to: $EMOJI $EMOTION (Tidbyt + Discord)"
