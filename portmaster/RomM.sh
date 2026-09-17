#!/bin/bash
# Direct launcher at ports root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/romm/RomM.sh" ]; then
  exec bash "$SCRIPT_DIR/romm/RomM.sh" "$@"
else
  echo "Error: $SCRIPT_DIR/romm/RomM.sh not found."
  exit 1
fi
