#!/bin/bash
# RomM R36S Client - Local Updater
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/../../tools/update_RomM.sh" ]; then
  exec "$SCRIPT_DIR/../../tools/update_RomM.sh"
else
  # Direct fallback
  if [ -c /dev/tty0 ]; then
    printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
    exec > /dev/tty0 2>&1
  fi
  echo "RomM Updater - Checking Git status..."
  if [ -d "$SCRIPT_DIR/.git" ]; then
    cd "$SCRIPT_DIR" && git fetch origin && git pull origin main
    echo "Git update complete!"
    sleep 3
  else
    echo "Updating via GitHub..."
    curl -sSL "https://raw.githubusercontent.com/Cavephar/RomM-R36S/main/update_RomM.sh" | bash
  fi
fi
