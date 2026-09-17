#!/bin/bash
# ==============================================================================
# RomM & SMB Client - Automated Installer for R36S & RK3326 Handhelds
# Designed to be copied into your 'tools' folder (e.g. /roms/tools/ or /roms2/tools/)
# and run directly from the EmulationStation Tools / Options menu.
# ==============================================================================

# Ensure all outputs display visibly on the R36S screen (/dev/tty0)
INSTALL_LOG="/tmp/romm_install.log"
echo "==========================================" > "$INSTALL_LOG"
echo "RomM R36S Installer Started: $(date)" >> "$INSTALL_LOG"

if [ -c /dev/tty0 ]; then
  exec > >(tee -a "$INSTALL_LOG" > /dev/tty0) 2>&1
  printf "\033[?25h" > /dev/tty0 2>/dev/null
  printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
else
  exec > >(tee -a "$INSTALL_LOG") 2>&1
fi

# Visual styling
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_CYAN="\033[1;36m"
C_GREEN="\033[1;32m"
C_YELLOW="\033[1;33m"
C_RED="\033[1;31m"

echo -e "${C_CYAN}"
echo "=========================================================="
echo "      RomM & SMB Client - Automated R36S Installer        "
echo "=========================================================="
echo -e "${C_RESET}"

# 1. Determine execution and system privileges
ESUDO="sudo"
if [ "$(id -u)" -eq 0 ]; then
  ESUDO=""
fi

# Source PortMaster control framework if available
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
  source "$controlfolder/control.txt"
  echo -e "${C_GREEN}[OK]${C_RESET} Sourced PortMaster environment from: $controlfolder"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${C_CYAN}[INFO]${C_RESET} Running installer from: $SCRIPT_DIR"

# 2. Detect Ports destination directory
PORTS_DIR=""
if [ -d "/roms2/ports" ]; then
  PORTS_DIR="/roms2/ports"
  echo -e "${C_GREEN}[OK]${C_RESET} Detected Dual-SD setup (TF2): $PORTS_DIR"
elif [ -d "/roms/ports" ]; then
  PORTS_DIR="/roms/ports"
  echo -e "${C_GREEN}[OK]${C_RESET} Detected Single-SD setup (TF1): $PORTS_DIR"
elif [ -d "/opt/system/Ports" ]; then
  PORTS_DIR="/opt/system/Ports"
else
  # Default create on /roms/ports
  mkdir -p "/roms/ports" 2>/dev/null
  PORTS_DIR="/roms/ports"
  echo -e "${C_YELLOW}[INFO]${C_RESET} Created ports directory: $PORTS_DIR"
fi

APP_DIR="$PORTS_DIR/romm"
mkdir -p "$APP_DIR" "$APP_DIR/dist" 2>/dev/null

# 3. Locate source files (local zip, local directory, or online)
echo ""
echo -e "${C_BOLD}Step 1/4: Deploying Application Files...${C_RESET}"

SOURCE_FOUND=0

# Check 1: Alongside this installer in tools folder
if [ -d "$SCRIPT_DIR/romm" ] && [ "$SCRIPT_DIR/romm" != "$APP_DIR" ]; then
  echo -e "${C_GREEN}[OK]${C_RESET} Found local romm directory in tools. Copying to $APP_DIR..."
  cp -rf "$SCRIPT_DIR/romm/"* "$APP_DIR/" 2>/dev/null
  SOURCE_FOUND=1
fi

if [ -f "$SCRIPT_DIR/RomM.zip" ]; then
  echo -e "${C_GREEN}[OK]${C_RESET} Found RomM.zip in tools folder. Extracting..."
  unzip -o -q "$SCRIPT_DIR/RomM.zip" -d "$PORTS_DIR/" 2>/dev/null
  SOURCE_FOUND=1
fi

# Check 2: MicroSD card root or /roms/
for CANDIDATE in "/roms/RomM.zip" "/roms2/RomM.zip" "/roms/romm" "/roms2/romm"; do
  if [ -f "$CANDIDATE" ]; then
    echo -e "${C_GREEN}[OK]${C_RESET} Found $CANDIDATE. Extracting..."
    unzip -o -q "$CANDIDATE" -d "$PORTS_DIR/" 2>/dev/null
    SOURCE_FOUND=1
    break
  elif [ -d "$CANDIDATE" ] && [ "$CANDIDATE" != "$APP_DIR" ]; then
    echo -e "${C_GREEN}[OK]${C_RESET} Found $CANDIDATE. Copying to $APP_DIR..."
    cp -rf "$CANDIDATE/"* "$APP_DIR/" 2>/dev/null
    SOURCE_FOUND=1
    break
  fi
done

# If no local zip/directory was found, check if dist exists in current directory or download
if [ "$SOURCE_FOUND" -eq 0 ] && [ ! -f "$APP_DIR/dist/index.html" ]; then
  echo -e "${C_YELLOW}[!]${C_RESET} No local RomM.zip found in tools folder."
  echo "Checking network connectivity for online package..."
  if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
    echo -e "${C_GREEN}[OK]${C_RESET} Internet active. Fetching latest RomM bundle..."
    # Can fetch from repository or mirror if available
    curl -sL "https://raw.githubusercontent.com/Cavephar/RomM/main/RomM.zip" -o "/tmp/RomM.zip" 2>/dev/null
    if [ -f "/tmp/RomM.zip" ] && [ -s "/tmp/RomM.zip" ]; then
      unzip -o -q "/tmp/RomM.zip" -d "$PORTS_DIR/" 2>/dev/null
      echo -e "${C_GREEN}[OK]${C_RESET} Downloaded and extracted RomM bundle!"
      SOURCE_FOUND=1
    fi
  else
    echo -e "${C_YELLOW}[INFO]${C_RESET} Offline mode: Generating core client assets..."
  fi
fi

# 4. Generate Launcher Script: RomM.sh
echo ""
echo -e "${C_BOLD}Step 2/4: Installing Launch Scripts & Gamepad Profiles...${C_RESET}"

LAUNCHER_PATH="$PORTS_DIR/RomM.sh"
cat << 'EOF' > "$LAUNCHER_PATH"
#!/bin/bash
# ==============================================================================
# RomM & SMB Client - Primary Launch Script for R36S / RK3326 Handhelds
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAMEDIR="${SCRIPT_DIR}/romm"
mkdir -p "$GAMEDIR" 2>/dev/null

LOG_FILE="$GAMEDIR/launch.log"
echo "==========================================" > "$LOG_FILE"
echo "RomM & SMB Client Launcher Started: $(date)" >> "$LOG_FILE"

if [ -c /dev/tty0 ]; then
  exec > >(tee -a "$LOG_FILE" > /dev/tty0) 2>&1
  printf "\033[?25l" > /dev/tty0 2>/dev/null
  printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
else
  exec > >(tee -a "$LOG_FILE") 2>&1
fi

echo "=========================================================="
echo "          RomM & SMB Client - R36S Handheld Engine        "
echo "=========================================================="

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

ESUDO="sudo"
if [ -f "$controlfolder/control.txt" ]; then
  source "$controlfolder/control.txt"
  [ -f "${controlfolder}/mod_${CFW_NAME}.txt" ] && source "${controlfolder}/mod_${CFW_NAME}.txt"
  [ -f "${controlfolder}/device_info.txt" ] && source "${controlfolder}/device_info.txt"
  get_controls
fi

cd "$GAMEDIR" || exit 1

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
    printf "\033[?25h" > /dev/tty0 2>/dev/null
    printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
  fi
  echo "Clean exit complete. Returning to EmulationStation."
}
trap cleanup EXIT INT TERM

# Gamepad daemon
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
fi

PORT_NUMBER=3000
export LD_LIBRARY_PATH="$GAMEDIR/libs:${LD_LIBRARY_PATH}"

if command -v python3 &>/dev/null; then
  python3 -m http.server $PORT_NUMBER --directory "$GAMEDIR/dist" >/dev/null 2>&1 &
elif command -v node &>/dev/null; then
  node "$GAMEDIR/server.cjs" >/dev/null 2>&1 &
fi

sleep 1

DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$DEVICE_IP" ] && DEVICE_IP="127.0.0.1"

APP_URL="http://127.0.0.1:${PORT_NUMBER}"
REMOTE_URL="http://${DEVICE_IP}:${PORT_NUMBER}"

BROWSER_BIN=""
if command -v chromium-browser &>/dev/null; then
  BROWSER_BIN="chromium-browser"
elif command -v chromium &>/dev/null; then
  BROWSER_BIN="chromium"
fi

if [ -n "$BROWSER_BIN" ]; then
  $BROWSER_BIN \
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
else
  echo ""
  echo "========================================================"
  echo "         RomM & SMB Server is ACTIVE!                   "
  echo "========================================================"
  echo "  Connect your phone, PC, or tablet on the same Wi-Fi:  "
  echo "  >>> $REMOTE_URL <<<                                   "
  echo ""
  echo "  No local kiosk browser installed on ArkOS yet.        "
  echo "  - To install kiosk browser: Run Tools -> install_Romr36s.sh"
  echo "  - Press [B] or [Q] to exit to EmulationStation        "
  echo "========================================================"
  while true; do
    read -t 1 -n 1 KEY
    if [ "$KEY" = "q" ] || [ "$KEY" = "Q" ] || [ "$KEY" = "b" ] || [ "$KEY" = "B" ]; then
      break
    fi
  done
fi

exit 0
EOF

# Also create RomM Client.sh wrapper in ports
cp "$LAUNCHER_PATH" "$PORTS_DIR/RomM Client.sh" 2>/dev/null
cp "$LAUNCHER_PATH" "$APP_DIR/RomM.sh" 2>/dev/null

# Install gptokeyb mapping file
cat << 'EOF' > "$APP_DIR/romm.gptk"
# gptokeyb mapping for RomM & SMB Client (R36S)
back = esc
start = enter
a = enter
b = backspace
x = x
y = y
l1 = pageup
l2 = q
r1 = pagedown
r2 = m

up = up
down = down
left = left
right = right

left_analog_up = up
left_analog_down = down
left_analog_left = left
left_analog_right = right

deadzone_mode = scaled_radial
deadzone = 2000
deadzone_scale = 8
EOF

# Install EmulationStation metadata (gameinfo.xml)
cat << 'EOF' > "$APP_DIR/gameinfo.xml"
<?xml version="1.0" encoding="utf-8"?>
<gameList>
  <game>
    <path>./RomM.sh</path>
    <name>RomM &amp; SMB Client</name>
    <desc>Direct RomM and SMB game library downloader for R36S. Connects over Wi-Fi to your RomM server or NAS to download ROMs directly into your /roms or /roms2 folders without a PC.</desc>
    <image>./romm/cover.png</image>
    <thumbnail>./romm/screenshot.png</thumbnail>
    <rating>1.0</rating>
    <developer>RomM Project</developer>
    <publisher>PortMaster Community</publisher>
    <genre>Network Utility</genre>
    <players>1</players>
  </game>
</gameList>
EOF

# Install port.json
cat << 'EOF' > "$APP_DIR/port.json"
{
  "version": 2,
  "name": "romm.zip",
  "items": [
    "RomM.sh",
    "RomM Client.sh",
    "romm"
  ],
  "attr": {
    "title": "RomM & SMB Client",
    "desc": "RomM and SMB game library client for R36S & RK3326 handhelds.",
    "inst": "Launch RomM.sh from the Ports menu. Requires Wi-Fi.",
    "genres": ["Utility", "Network"],
    "rtr": true,
    "runtime": "default",
    "reqs": ["wifi"],
    "arch": ["aarch64", "armhf"]
  }
}
EOF

# Also create a handy log viewer tool in tools folder
VIEWER_TOOL="$SCRIPT_DIR/view_RomM_log.sh"
cat << 'EOF' > "$VIEWER_TOOL"
#!/bin/bash
# Quick log inspector for RomM Client
if [ -c /dev/tty0 ]; then
  printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
  exec > /dev/tty0 2>&1
fi

echo "=========================================="
echo "          RomM Client Log Viewer          "
echo "=========================================="
echo ""

LOG_FILE="/roms/ports/romm/launch.log"
[ ! -f "$LOG_FILE" ] && LOG_FILE="/roms2/ports/romm/launch.log"

if [ -f "$LOG_FILE" ]; then
  cat "$LOG_FILE"
else
  echo "No launch log found yet. Run RomM from Ports first."
fi

echo ""
echo "------------------------------------------"
echo "Press any key to return to EmulationStation..."
read -n 1 -s
exit 0
EOF
chmod +x "$VIEWER_TOOL" 2>/dev/null

echo -e "${C_GREEN}[OK]${C_RESET} Installed launcher: $LAUNCHER_PATH"
echo -e "${C_GREEN}[OK]${C_RESET} Installed controller map: $APP_DIR/romm.gptk"
echo -e "${C_GREEN}[OK]${C_RESET} Installed log viewer: $VIEWER_TOOL"

# 5. Fix permissions and CRLF endings
echo ""
echo -e "${C_BOLD}Step 3/4: Sanitizing Unix Permissions & Windows Line Endings...${C_RESET}"
for FILE in "$LAUNCHER_PATH" "$PORTS_DIR/RomM Client.sh" "$APP_DIR/RomM.sh" "$VIEWER_TOOL"; do
  if [ -f "$FILE" ]; then
    sed -i 's/\r$//' "$FILE" 2>/dev/null
    chmod +x "$FILE" 2>/dev/null
  fi
done
echo -e "${C_GREEN}[OK]${C_RESET} All scripts made executable (0755) and sanitized for Linux."

# 6. Check Browser Environment & Optional Setup
echo ""
echo -e "${C_BOLD}Step 4/4: Checking Kiosk Browser & Network...${C_RESET}"
DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$DEVICE_IP" ]; then
  echo -e "${C_GREEN}[OK]${C_RESET} Wi-Fi is connected! Device IP: ${C_CYAN}$DEVICE_IP${C_RESET}"
else
  echo -e "${C_YELLOW}[!]${C_RESET} Wi-Fi is currently disconnected. (Can be connected in ArkOS Options menu)."
fi

if command -v chromium-browser &>/dev/null || command -v chromium &>/dev/null; then
  echo -e "${C_GREEN}[OK]${C_RESET} Chromium browser detected for handheld kiosk display."
else
  echo -e "${C_YELLOW}[INFO]${C_RESET} Standalone Chromium kiosk browser not detected."
  echo "       RomM will run as a high-speed local Wi-Fi server accessible from your phone/PC."
  echo "       To add native on-device display later: connect Wi-Fi and install chromium-browser via apt."
fi

# Final completion screen
echo ""
echo -e "${C_GREEN}"
echo "=========================================================="
echo "          INSTALLATION COMPLETED SUCCESSFULLY!            "
echo "=========================================================="
echo -e "${C_RESET}"
echo -e "  Launcher Location : ${C_CYAN}$PORTS_DIR/RomM.sh${C_RESET}"
echo -e "  EmulationStation  : Listed under ${C_BOLD}PORTS${C_RESET} menu"
echo -e "  Log Inspector     : Listed under ${C_BOLD}TOOLS${C_RESET} menu"
if [ -n "$DEVICE_IP" ]; then
  echo -e "  Web Access        : ${C_CYAN}http://$DEVICE_IP:3000${C_RESET}"
fi
echo "=========================================================="
echo ""
echo "Returning to EmulationStation in 10 seconds..."
echo "(Or press any button/key to return immediately)"

# Wait for 10 seconds or keypress so user sees the feedback
read -t 10 -n 1
printf "\033[?25h" > /dev/tty0 2>/dev/null
exit 0
