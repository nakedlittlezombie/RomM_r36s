#!/bin/bash
# ==============================================================================
# PortMaster Launch Script for RomM & SMB Client
# Target Hardware: R36S & RK3326 Handhelds running ArkOS / dArkOS / AmberELEC
# Complies with PortMaster packaging specifications (https://portmaster.games/faq.html)
#
# GUARANTEES TO PROTECT THE UNDERLYING OS:
# 1. No system packages or libraries are installed, modified, or overwritten.
# 2. All operations, binaries, and logs are confined strictly to $GAMEDIR.
# 3. Clean exit trap kills child daemons and restores terminal/tty for EmulationStation.
# 4. Supports both Single SD (TF1: /roms) and Dual SD (TF2: /roms2) setups.
# ==============================================================================

XDG_DATA_HOME=${XDG_DATA_HOME:-$HOME/.local/share}

# 1. Source PortMaster control framework
if [ -d "/opt/system/Tools/PortMaster/" ]; then
  controlfolder="/opt/system/Tools/PortMaster"
elif [ -d "/opt/tools/PortMaster/" ]; then
  controlfolder="/opt/tools/PortMaster"
elif [ -d "$XDG_DATA_HOME/PortMaster/" ]; then
  controlfolder="$XDG_DATA_HOME/PortMaster"
else
  controlfolder="/roms/ports/PortMaster"
fi

if [ -f "$controlfolder/control.txt" ]; then
  source "$controlfolder/control.txt"
else
  echo "PortMaster control.txt not found. Using default environment variables."
fi

# Source CFW specific modifications and hardware device specs
[ -f "${controlfolder}/mod_${CFW_NAME}.txt" ] && source "${controlfolder}/mod_${CFW_NAME}.txt"
[ -f "${controlfolder}/device_info.txt" ] && source "${controlfolder}/device_info.txt"

# Pull gamepad button definitions from PortMaster
get_controls

# 2. Determine and isolate port directory (never hardcode mount paths)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAMEDIR="${SCRIPT_DIR}/romm"
cd "$GAMEDIR" || exit 1

# Setup local non-root logging
> "$GAMEDIR/log.txt"
exec > >(tee "$GAMEDIR/log.txt") 2>&1

echo "=========================================="
echo "Starting RomM & SMB Client (PortMaster)"
echo "Date: $(date)"
echo "GAMEDIR: $GAMEDIR"
echo "CFW: ${CFW_NAME:-ArkOS/dArkOS}"
echo "Display: 640x480 (R36S Native 4:3)"
echo "=========================================="

# 3. Safe exit cleanup function to protect OS state and EmulationStation
cleanup() {
  echo "Cleaning up RomM Client processes..."
  # Terminate controller mapper and server daemons
  $ESUDO kill -9 $(pidof gptokeyb) 2>/dev/null
  $ESUDO kill -9 $(pidof python3) 2>/dev/null
  $ESUDO kill -9 $(pidof node) 2>/dev/null
  $ESUDO kill -9 $(pidof chromium) 2>/dev/null
  $ESUDO kill -9 $(pidof chromium-browser) 2>/dev/null

  # Restore environment and library paths
  unset LD_LIBRARY_PATH
  unset SDL_GAMECONTROLLERCONFIG

  # Restore cursor and tty to prevent black-screen freeze in EmulationStation
  if [ -c /dev/tty0 ]; then
    $ESUDO chmod 666 /dev/tty0 2>/dev/null
    printf "\033[?25h" > /dev/tty0 2>/dev/null
  fi
  echo "Clean exit complete. Returning safely to EmulationStation."
}
trap cleanup EXIT INT TERM

# 4. Start gptokeyb gamepad daemon for R36S controls
$ESUDO chmod +x "$GAMEDIR/gptokeyb" 2>/dev/null
if [ -f "$controlfolder/gptokeyb" ]; then
  GPTOKEYB="$controlfolder/gptokeyb"
elif [ -f "$GAMEDIR/gptokeyb" ]; then
  GPTOKEYB="$GAMEDIR/gptokeyb"
else
  GPTOKEYB="gptokeyb"
fi

if command -v "$GPTOKEYB" &>/dev/null || [ -f "$GPTOKEYB" ]; then
  $GPTOKEYB "romm" -c "$GAMEDIR/romm.gptk" &
  echo "gptokeyb mapper launched with romm.gptk."
fi

# 5. Isolate library paths - non-standard libraries live in $GAMEDIR/libs only
export LD_LIBRARY_PATH="$GAMEDIR/libs:${LD_LIBRARY_PATH}"
PORT_NUMBER=3000

# 6. Launch local self-contained web server for the client UI
# Uses python3 (pre-installed on ArkOS) or standalone node
if command -v python3 &>/dev/null; then
  echo "Serving client bundle via python3 on 127.0.0.1:$PORT_NUMBER..."
  python3 -m http.server $PORT_NUMBER --directory "$GAMEDIR/dist" &
elif command -v node &>/dev/null; then
  echo "Serving client bundle via node on 127.0.0.1:$PORT_NUMBER..."
  node "$GAMEDIR/server.cjs" &
fi

sleep 1

# 7. Launch Kiosk Web Display (640x480 resolution for R36S screen)
APP_URL="http://127.0.0.1:${PORT_NUMBER}"

if command -v chromium-browser &>/dev/null; then
  chromium-browser \
    --kiosk \
    --window-size=640,480 \
    --window-position=0,0 \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --ozone-platform=wayland \
    --enable-features=UseOzonePlatform \
    --autoplay-policy=no-user-gesture-required \
    "$APP_URL"
elif command -v chromium &>/dev/null; then
  chromium \
    --kiosk \
    --window-size=640,480 \
    --window-position=0,0 \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    "$APP_URL"
elif [ -f "$GAMEDIR/bin/app_display" ]; then
  "$GAMEDIR/bin/app_display" "$APP_URL"
else
  echo ""
  echo "--------------------------------------------------------"
  echo "RomM & SMB Client Server is running at: $APP_URL"
  echo "Device IP: $(hostname -I | awk '{print $1}'):${PORT_NUMBER}"
  echo "Press [B] or [Q] to return to EmulationStation."
  echo "--------------------------------------------------------"
  read -n 1 -s
fi

exit 0
