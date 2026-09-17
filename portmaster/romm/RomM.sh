#!/bin/bash
# ==============================================================================
# RomM & SMB Client - Primary Launch Script for R36S / RK3326 Handhelds
# Designed for ArkOS, dArkOS, AmberELEC, and PortMaster environments
# ==============================================================================

# Ensure output is visible on the R36S LCD display (tty0) and logged to file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAMEDIR="${SCRIPT_DIR}/romm"

# Create port directory if needed
mkdir -p "$GAMEDIR" 2>/dev/null

# Log file setup
LOG_FILE="$GAMEDIR/launch.log"
echo "==========================================" > "$LOG_FILE"
echo "RomM & SMB Client Launcher Started" >> "$LOG_FILE"
echo "Timestamp: $(date)" >> "$LOG_FILE"

# Redirect stdout/stderr to both the display and the log file
if [ -c /dev/tty0 ]; then
  exec > >(tee -a "$LOG_FILE" > /dev/tty0) 2>&1
  # Reset terminal font and clear screen
  printf "\033[?25l" > /dev/tty0 2>/dev/null
  printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
else
  exec > >(tee -a "$LOG_FILE") 2>&1
fi

echo "=========================================================="
echo "          RomM & SMB Client - R36S Handheld Engine        "
echo "=========================================================="
echo "Initializing environment..."

# 1. Source PortMaster control framework if available
XDG_DATA_HOME=${XDG_DATA_HOME:-$HOME/.local/share}
if [ -d "/opt/system/Tools/PortMaster/" ]; then
  controlfolder="/opt/system/Tools/PortMaster"
elif [ -d "/opt/tools/PortMaster/" ]; then
  controlfolder="/opt/tools/PortMaster"
elif [ -d "$XDG_DATA_HOME/PortMaster/" ]; then
  controlfolder="$XDG_DATA_HOME/PortMaster"
elif [ -d "/roms/ports/PortMaster/" ]; then
  controlfolder="/roms/ports/PortMaster"
elif [ -d "/roms2/ports/PortMaster/" ]; then
  controlfolder="/roms2/ports/PortMaster"
fi

if [ -f "$controlfolder/control.txt" ]; then
  echo "[OK] Sourcing PortMaster controls from: $controlfolder"
  source "$controlfolder/control.txt"
  [ -f "${controlfolder}/mod_${CFW_NAME}.txt" ] && source "${controlfolder}/mod_${CFW_NAME}.txt"
  [ -f "${controlfolder}/device_info.txt" ] && source "${controlfolder}/device_info.txt"
  get_controls
else
  echo "[INFO] Standalone mode (PortMaster control.txt not detected)."
  ESUDO="sudo"
fi

cd "$GAMEDIR" || exit 1

# 2. Cleanup trap for clean exit to EmulationStation
cleanup() {
  echo ""
  echo "Stopping RomM Client processes..."
  $ESUDO kill -9 $(pidof gptokeyb) 2>/dev/null
  $ESUDO kill -9 $(pidof python3) 2>/dev/null
  $ESUDO kill -9 $(pidof node) 2>/dev/null
  $ESUDO kill -9 $(pidof chromium-browser) 2>/dev/null
  $ESUDO kill -9 $(pidof chromium) 2>/dev/null

  unset LD_LIBRARY_PATH
  unset SDL_GAMECONTROLLERCONFIG

  if [ -c /dev/tty0 ]; then
    # Re-enable cursor and clear display
    printf "\033[?25h" > /dev/tty0 2>/dev/null
    printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
  fi
  echo "Exited cleanly. Returning to EmulationStation."
}
trap cleanup EXIT INT TERM

# 3. Start gamepad mapping daemon (gptokeyb)
GPTOKEYB=""
if [ -f "$controlfolder/gptokeyb" ]; then
  GPTOKEYB="$controlfolder/gptokeyb"
elif [ -f "$GAMEDIR/gptokeyb" ]; then
  GPTOKEYB="$GAMEDIR/gptokeyb"
elif command -v gptokeyb &>/dev/null; then
  GPTOKEYB="gptokeyb"
fi

if [ -n "$GPTOKEYB" ] && [ -f "$GAMEDIR/romm.gptk" ]; then
  $ESUDO chmod +x "$GPTOKEYB" 2>/dev/null
  $GPTOKEYB "romm" -c "$GAMEDIR/romm.gptk" &
  echo "[OK] Controller mapping active (gptokeyb)."
fi

# 4. Launch local web server on port 3000
PORT_NUMBER=3000
export LD_LIBRARY_PATH="$GAMEDIR/libs:${LD_LIBRARY_PATH}"

SERVER_STARTED=0
if command -v python3 &>/dev/null; then
  echo "[OK] Starting client web server via python3 on 127.0.0.1:$PORT_NUMBER..."
  python3 -m http.server $PORT_NUMBER --directory "$GAMEDIR/dist" >/dev/null 2>&1 &
  SERVER_STARTED=1
elif command -v node &>/dev/null; then
  echo "[OK] Starting client web server via node on 127.0.0.1:$PORT_NUMBER..."
  node "$GAMEDIR/server.cjs" >/dev/null 2>&1 &
  SERVER_STARTED=1
else
  echo "[WARN] Neither python3 nor node found. Attempting basic static host..."
fi

sleep 1

# Detect local IP address
DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$DEVICE_IP" ] && DEVICE_IP="127.0.0.1"

APP_URL="http://127.0.0.1:${PORT_NUMBER}"
REMOTE_URL="http://${DEVICE_IP}:${PORT_NUMBER}"

echo "=========================================================="
echo " RomM & SMB Client Server is ACTIVE!"
echo " Local URL  : $APP_URL"
echo " Network URL: $REMOTE_URL"
echo "=========================================================="

# 5. Determine display mechanism
BROWSER_BIN=""
if command -v chromium-browser &>/dev/null; then
  BROWSER_BIN="chromium-browser"
elif command -v chromium &>/dev/null; then
  BROWSER_BIN="chromium"
elif [ -f "/opt/google/chrome/chrome" ]; then
  BROWSER_BIN="/opt/google/chrome/chrome"
fi

# Ensure DISPLAY is set for X11 / fbdev environments (ArkOS default)
export DISPLAY="${DISPLAY:-:0}"

if [ -z "$BROWSER_BIN" ]; then
  # Onscreen prompt for handheld display
  echo ""
  echo "--------------------------------------------------------"
  echo "   STANDALONE KIOSK BROWSER NOT YET INSTALLED"
  echo "--------------------------------------------------------"
  echo "  RomM server is currently active in the background:"
  echo "  Access via Phone/PC Browser: $REMOTE_URL"
  echo ""
  echo "  HANDHELD ON-DEVICE SCREEN OPTIONS:"
  echo "  [A] Press (A) to auto-install Chromium now (Requires Wi-Fi)"
  echo "  [B] Press (B) to exit back to EmulationStation"
  echo "  Or access $REMOTE_URL from any device on your Wi-Fi."
  echo "--------------------------------------------------------"
  echo "Waiting for input (Press A to Install, or B to Exit)..."

  while true; do
    read -t 1 -n 1 KEY
    if [ "$KEY" = "a" ] || [ "$KEY" = "A" ] || [ "$KEY" = "y" ] || [ "$KEY" = "Y" ]; then
      echo ""
      echo "========================================================"
      echo " Installing Chromium Kiosk Browser via apt-get..."
      echo "========================================================"
      $ESUDO apt-get update -y
      $ESUDO apt-get install -y --no-install-recommends chromium-browser || $ESUDO apt-get install -y chromium
      if command -v chromium-browser &>/dev/null; then
        BROWSER_BIN="chromium-browser"
        break
      elif command -v chromium &>/dev/null; then
        BROWSER_BIN="chromium"
        break
      else
        echo "Installation failed. Please check your Wi-Fi or run 'Install_Chromium_Kiosk.sh' in Tools."
        sleep 4
        break
      fi
    elif [ "$KEY" = "q" ] || [ "$KEY" = "Q" ] || [ "$KEY" = "b" ] || [ "$KEY" = "B" ]; then
      break
    fi
  done
fi

if [ -n "$BROWSER_BIN" ]; then
  echo "[OK] Launching kiosk display via $BROWSER_BIN (640x480)..."
  
  CHROMIUM_FLAGS=(
    --no-sandbox
    --test-type
    --kiosk
    --window-size=640,480
    --window-position=0,0
    --start-fullscreen
    --noerrdialogs
    --disable-infobars
    --no-first-run
    --disable-session-crashed-bubble
    --disable-pinch
    --overscroll-history-navigation=0
    --autoplay-policy=no-user-gesture-required
  )

  # Only specify wayland if WAYLAND_DISPLAY is actually running
  if [ -n "$WAYLAND_DISPLAY" ]; then
    CHROMIUM_FLAGS+=(--ozone-platform=wayland --enable-features=UseOzonePlatform)
  fi

  $BROWSER_BIN "${CHROMIUM_FLAGS[@]}" "$APP_URL"
  EXIT_CODE=$?
  echo "Browser closed with exit code: $EXIT_CODE"
fi

exit 0
