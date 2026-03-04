#!/usr/bin/env bash
# mood-sync.sh — Infer current emotional state from activity signals
# Called by cron job; outputs JSON for agent to parse and act on
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Get current hour (0-23) in local time
HOUR=$(date +%H | sed 's/^0//')

# Count recent sessions (last 30 min)
SESSIONS_DIR="$HOME/.openclaw/sessions"
RECENT_SESSIONS=0
if [[ -d "$SESSIONS_DIR" ]]; then
  RECENT_SESSIONS=$(find "$SESSIONS_DIR" -name "*.json" -mmin -30 2>/dev/null | wc -l)
fi

# Check for recent errors in gateway log
GATEWAY_LOG="$HOME/.openclaw/logs/gateway.log"
RECENT_ERRORS=0
if [[ -f "$GATEWAY_LOG" ]]; then
  RECENT_ERRORS=$(tail -200 "$GATEWAY_LOG" 2>/dev/null | grep -ci "error\|failed\|exception" || echo 0)
fi

# Check if any cron jobs failed recently
CRON_ERRORS=0
CRON_DIR="$HOME/.openclaw/cron"
if [[ -d "$CRON_DIR" ]]; then
  CRON_ERRORS=$(grep -l '"lastStatus":"error"' "$CRON_DIR"/*.json 2>/dev/null | wc -l || true)
fi

# Output signals for agent to interpret
cat <<EOF
MOOD_SYNC_DATA:
  hour: $HOUR
  recent_sessions: $RECENT_SESSIONS
  recent_errors: $RECENT_ERRORS
  cron_errors: $CRON_ERRORS
  
INTERPRETATION_GUIDE:
  - hour 6-9, low activity: focused (starting the day)
  - hour 6-9, high activity: excited (busy morning)
  - hour 10-17, moderate activity: neutral or focused
  - hour 10-17, high activity (>5 sessions): excited
  - hour 10-17, errors present: worried
  - hour 18-21: neutral (winding down)
  - hour 22-5: sleepy
  - cron_errors > 0: worried
  - recent_errors > 10: worried or confused
  - recent_sessions > 10 in 30min: excited

Pick ONE emotion: neutral, happy, sad, angry, surprised, worried, sleepy, excited, confused, focused
EOF
