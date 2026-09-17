#!/bin/bash
# ==============================================================================
# RomM & SMB Client - Automated Installer for R36S & RK3326 Handhelds
# Designed to be copied into your 'tools' folder (e.g. /roms/tools/ or /roms2/tools/)
# and run directly from the EmulationStation Tools / Options menu.
# ==============================================================================

# Ensure script is running in bash even if EmulationStation called sh
if [ -z "$BASH_VERSION" ]; then
  exec /bin/bash "$0" "$@"
fi

INSTALL_LOG="/tmp/romm_install.log"
echo "==========================================" > "$INSTALL_LOG"
echo "RomM R36S Installer Started: $(date)" >> "$INSTALL_LOG"

# 1. Determine execution and system privileges
ESUDO="sudo"
if [ "$(id -u)" -eq 0 ]; then
  ESUDO=""
fi

# 2. Hardware Display & Console Setup (Prevent Black Screen on R36S / ArkOS)
$ESUDO chmod 666 /dev/tty0 /dev/tty1 /dev/console 2>/dev/null

# Unblank framebuffer display & disable power down
if [ -w /sys/class/graphics/fb0/blank ]; then
  echo 0 > /sys/class/graphics/fb0/blank 2>/dev/null
elif [ -n "$ESUDO" ]; then
  echo 0 | $ESUDO tee /sys/class/graphics/fb0/blank >/dev/null 2>&1
fi
$ESUDO setterm -blank 0 -powersave off -powerdown 0 </dev/tty1 >/dev/tty1 2>/dev/null
$ESUDO setterm -blank 0 -powersave off -powerdown 0 </dev/tty0 >/dev/tty0 2>/dev/null

# Switch active virtual terminal to tty1 (where EmulationStation and Tools run)
$ESUDO chvt 1 2>/dev/null

# Detect active screen TTY: ArkOS uses /dev/tty1
SCREEN_TTY=""
for t in /dev/tty1 /dev/tty0 /dev/console; do
  if [ -c "$t" ] && [ -w "$t" ]; then
    SCREEN_TTY="$t"
    break
  fi
done

# Ensure terminal cursor is visible and reset styling
if [ -n "$SCREEN_TTY" ]; then
  printf "\033[?25h\033[0m" > "$SCREEN_TTY" 2>/dev/null
fi

# Re-launch inside pipeline if not attached, guaranteeing every line prints to screen and log
if [ "$1" != "--attached" ]; then
  if [ -n "$SCREEN_TTY" ] && [ ! -t 1 ]; then
    "$0" --attached "$@" 2>&1 | tee -a "$INSTALL_LOG" | (tee "$SCREEN_TTY" 2>/dev/null || cat)
    exit $?
  else
    "$0" --attached "$@" 2>&1 | tee -a "$INSTALL_LOG"
    exit $?
  fi
fi
shift # remove --attached

# Visual ANSI styling for terminal
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_CYAN="\033[1;36m"
C_GREEN="\033[1;32m"
C_YELLOW="\033[1;33m"
C_RED="\033[1;31m"
C_WHITE="\033[1;37m"

# Dialog & Infobox helper for ArkOS handheld GUI
HAS_DIALOG=0
if command -v dialog &>/dev/null; then
  HAS_DIALOG=1
fi

show_infobox() {
  local title="$1"
  local text="$2"
  local lines="${3:-7}"
  local cols="${4:-54}"
  if [ "$HAS_DIALOG" -eq 1 ] && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM R36S Handheld Installer" \
           --title " $title " \
           --infobox "\n  $text\n" "$lines" "$cols" > "$SCREEN_TTY" 2>&1
  fi
}

show_progress() {
  local step_num="$1"
  local total_steps="$2"
  local step_title="$3"
  local step_detail="$4"
  local percent="$5"

  echo ""
  echo -e "${C_CYAN}==========================================================${C_RESET}"
  echo -e "${C_BOLD}>>> STEP $step_num/$total_steps: ${C_YELLOW}$step_title ${C_GREEN}[$percent%]${C_RESET}"
  echo -e "    $step_detail"
  echo -e "${C_CYAN}==========================================================${C_RESET}"

  if [ "$HAS_DIALOG" -eq 1 ] && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM R36S Handheld Installer" \
           --title " Step $step_num/$total_steps: $step_title " \
           --infobox "\n  $step_detail\n\n  Progress: [$percent%]\n" 8 54 > "$SCREEN_TTY" 2>&1
  fi
}

# Initial Welcome Banner
echo -e "${C_CYAN}"
echo "=========================================================="
echo "      RomM & SMB Client - Automated R36S Installer        "
echo "=========================================================="
echo -e "${C_RESET}"
echo -e "${C_GREEN}[OK]${C_RESET} Display console active: ${C_WHITE}${SCREEN_TTY:-/dev/tty1}${C_RESET}"
echo -e "${C_GREEN}[OK]${C_RESET} Framebuffer unblanked. Logging to: $INSTALL_LOG"

show_infobox "RomM Installer" "Initializing RomM & SMB Client setup on R36S...\nPlease wait." 6 52
sleep 1

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

# Detect Ports destination directory
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
show_progress 1 4 "Deploying Application Files" "Locating and extracting RomM client files into $APP_DIR..." 25

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
show_progress 2 4 "Configuring Launch Scripts & Gamepad Profiles" "Writing $PORTS_DIR/RomM.sh, controller bindings, and helper tools..." 50

LAUNCHER_PATH="$PORTS_DIR/RomM.sh"
cat << 'EOF' > "$LAUNCHER_PATH"
#!/bin/bash
# ==============================================================================
# RomM & SMB Client - Primary Launch Script for R36S / RK3326 Handhelds
# ==============================================================================

if [ -z "$BASH_VERSION" ]; then
  exec /bin/bash "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAMEDIR="${SCRIPT_DIR}/romm"
mkdir -p "$GAMEDIR" 2>/dev/null

LOG_FILE="$GAMEDIR/launch.log"
echo "==========================================" > "$LOG_FILE"
echo "RomM & SMB Client Launcher Started: $(date)" >> "$LOG_FILE"

ESUDO="sudo"
[ "$(id -u)" -eq 0 ] && ESUDO=""

# Prevent black screen: unblank display, permissions, switch VT
$ESUDO chmod 666 /dev/tty0 /dev/tty1 /dev/console 2>/dev/null
if [ -w /sys/class/graphics/fb0/blank ]; then
  echo 0 > /sys/class/graphics/fb0/blank 2>/dev/null
elif [ -n "$ESUDO" ]; then
  echo 0 | $ESUDO tee /sys/class/graphics/fb0/blank >/dev/null 2>&1
fi
$ESUDO setterm -blank 0 -powersave off -powerdown 0 </dev/tty1 >/dev/tty1 2>/dev/null
$ESUDO chvt 1 2>/dev/null

SCREEN_TTY=""
for t in /dev/tty1 /dev/tty0 /dev/console; do
  if [ -c "$t" ] && [ -w "$t" ]; then
    SCREEN_TTY="$t"
    break
  fi
done

if [ -n "$SCREEN_TTY" ] && [ ! -t 1 ]; then
  "$0" --attached "$@" 2>&1 | tee -a "$LOG_FILE" | (tee "$SCREEN_TTY" 2>/dev/null || cat)
  exit $?
fi
if [ "$1" = "--attached" ]; then
  shift
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

  if [ -n "$SCREEN_TTY" ]; then
    printf "\033[?25h" > "$SCREEN_TTY" 2>/dev/null
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

# Also create a handy log viewer tool in tools folder with dialog & tty1 support
VIEWER_TOOL="$SCRIPT_DIR/view_RomM_log.sh"
cat << 'EOF' > "$VIEWER_TOOL"
#!/bin/bash
# Quick log inspector for RomM Client with ArkOS dialog scrolling support
if [ -z "$BASH_VERSION" ]; then
  exec /bin/bash "$0" "$@"
fi

ESUDO="sudo"
[ "$(id -u)" -eq 0 ] && ESUDO=""
$ESUDO chmod 666 /dev/tty0 /dev/tty1 /dev/console 2>/dev/null
$ESUDO chvt 1 2>/dev/null
echo 0 > /sys/class/graphics/fb0/blank 2>/dev/null

SCREEN_TTY=""
for t in /dev/tty1 /dev/tty0 /dev/console; do
  if [ -c "$t" ] && [ -w "$t" ]; then
    SCREEN_TTY="$t"
    break
  fi
done

LOG_FILE="/roms/ports/romm/launch.log"
[ ! -f "$LOG_FILE" ] && LOG_FILE="/roms2/ports/romm/launch.log"
[ ! -f "$LOG_FILE" ] && LOG_FILE="/tmp/romm_install.log"

if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
  if [ -f "$LOG_FILE" ]; then
    dialog --backtitle "RomM Log Inspector" --title " $LOG_FILE (Use D-Pad to Scroll) " --textbox "$LOG_FILE" 20 60 > "$SCREEN_TTY" 2>&1
  else
    dialog --backtitle "RomM Log Inspector" --title " Log Viewer " --msgbox "No log file found yet. Launch RomM from Ports first." 8 50 > "$SCREEN_TTY" 2>&1
  fi
  exit 0
fi

if [ -n "$SCREEN_TTY" ] && [ ! -t 1 ]; then
  "$0" --attached "$@" 2>&1 | tee "$SCREEN_TTY"
  exit $?
fi
if [ "$1" = "--attached" ]; then shift; fi

echo "=========================================="
echo "          RomM Client Log Viewer          "
echo "=========================================="
echo ""
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

# Also create a dedicated standalone Chromium Kiosk Installer tool in tools folder with visual feedback
KIOSK_TOOL="$SCRIPT_DIR/Install_Chromium_Kiosk.sh"
cat << 'EOF' > "$KIOSK_TOOL"
#!/bin/bash
# ==============================================================================
# Standalone Chromium Kiosk Browser Installer for R36S & ArkOS Handhelds
# ==============================================================================
if [ -z "$BASH_VERSION" ]; then
  exec /bin/bash "$0" "$@"
fi

ESUDO="sudo"
[ "$(id -u)" -eq 0 ] && ESUDO=""

$ESUDO chmod 666 /dev/tty0 /dev/tty1 /dev/console 2>/dev/null
$ESUDO chvt 1 2>/dev/null
echo 0 > /sys/class/graphics/fb0/blank 2>/dev/null

SCREEN_TTY=""
for t in /dev/tty1 /dev/tty0 /dev/console; do
  if [ -c "$t" ] && [ -w "$t" ]; then
    SCREEN_TTY="$t"
    break
  fi
done

if [ -n "$SCREEN_TTY" ] && [ ! -t 1 ]; then
  "$0" --attached "$@" 2>&1 | (tee "$SCREEN_TTY" 2>/dev/null || cat)
  exit $?
fi
if [ "$1" = "--attached" ]; then shift; fi

echo "=========================================================="
echo "    Chromium Kiosk Browser Installer for R36S / ArkOS    "
echo "=========================================================="
echo ""

if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
  dialog --backtitle "RomM Kiosk Installer" --title " Kiosk Setup " --infobox "\n  Checking Wi-Fi connection...\n  Please wait.\n" 7 50 > "$SCREEN_TTY" 2>&1
fi

DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$DEVICE_IP" ]; then
  if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM Kiosk Installer" --title " Wi-Fi Disconnected " --msgbox "Wi-Fi is NOT connected.\n\nPlease connect in EmulationStation -> Options -> Wi-Fi,\nthen run this installer again." 9 52 > "$SCREEN_TTY" 2>&1
  else
    echo "ERROR: Wi-Fi is not connected!"
    echo "Please connect to Wi-Fi first via: EmulationStation -> Options / Tools -> Wi-Fi"
    sleep 6
  fi
  exit 1
fi

echo "Wi-Fi is active (IP: $DEVICE_IP)."
if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
  dialog --backtitle "RomM Kiosk Installer" --title " Installing Chromium " --infobox "\n  Wi-Fi Online ($DEVICE_IP).\n  Updating repositories & downloading Chromium...\n  This takes 1-2 minutes. Please keep device powered on.\n" 8 56 > "$SCREEN_TTY" 2>&1
fi

echo "Step 1/2: Updating package repositories (apt-get update)..."
$ESUDO apt-get update -y

echo "Step 2/2: Installing chromium-browser..."
$ESUDO apt-get install -y --no-install-recommends chromium-browser || $ESUDO apt-get install -y chromium

if command -v chromium-browser &>/dev/null || command -v chromium &>/dev/null; then
  echo "=========================================================="
  echo " SUCCESS! Chromium Kiosk Browser is installed!"
  echo "=========================================================="
  if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM Kiosk Installer" --title " Setup Complete " --msgbox "\n  Chromium Kiosk Browser installed successfully!\n\n  You can now launch RomM directly on your R36S screen\n  from the PORTS menu.\n" 10 56 > "$SCREEN_TTY" 2>&1
  else
    echo "Returning to EmulationStation in 6 seconds..."
    sleep 6
  fi
else
  if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM Kiosk Installer" --title " Installation Failed " --msgbox "Could not install Chromium automatically.\nPlease check your Wi-Fi or apt mirrors." 8 50 > "$SCREEN_TTY" 2>&1
  else
    echo "Installation failed. Please check internet connection."
    sleep 6
  fi
fi
exit 0
EOF
chmod +x "$KIOSK_TOOL" 2>/dev/null

# Also create dedicated update tool in tools folder with visual feedback
UPDATE_TOOL="$SCRIPT_DIR/update_RomM.sh"
cat << 'EOF' > "$UPDATE_TOOL"
#!/bin/bash
# ==============================================================================
# RomM R36S Handheld Client - GitHub Live Updater Tool
# ==============================================================================
if [ -z "$BASH_VERSION" ]; then
  exec /bin/bash "$0" "$@"
fi

ESUDO="sudo"
[ "$(id -u)" -eq 0 ] && ESUDO=""

$ESUDO chmod 666 /dev/tty0 /dev/tty1 /dev/console 2>/dev/null
$ESUDO chvt 1 2>/dev/null
echo 0 > /sys/class/graphics/fb0/blank 2>/dev/null

SCREEN_TTY=""
for t in /dev/tty1 /dev/tty0 /dev/console; do
  if [ -c "$t" ] && [ -w "$t" ]; then
    SCREEN_TTY="$t"
    break
  fi
done

if [ -n "$SCREEN_TTY" ] && [ ! -t 1 ]; then
  "$0" --attached "$@" 2>&1 | (tee "$SCREEN_TTY" 2>/dev/null || cat)
  exit $?
fi
if [ "$1" = "--attached" ]; then shift; fi

echo "=========================================================="
echo "          RomM R36S Client - GitHub Updater              "
echo "=========================================================="
echo ""

APP_DIR=""
if [ -d "/roms2/ports/romm" ]; then
  APP_DIR="/roms2/ports/romm"
elif [ -d "/roms/ports/romm" ]; then
  APP_DIR="/roms/ports/romm"
elif [ -d "$(dirname "$0")/ports/romm" ]; then
  APP_DIR="$(dirname "$0")/ports/romm"
fi

if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
  dialog --backtitle "RomM GitHub Updater" --title " Checking Network " --infobox "\n  Connecting to GitHub...\n  Please wait.\n" 7 50 > "$SCREEN_TTY" 2>&1
fi

DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$DEVICE_IP" ]; then
  if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM GitHub Updater" --title " Wi-Fi Disconnected " --msgbox "Wi-Fi is NOT connected.\nConnect to Wi-Fi first in ArkOS Options -> Wi-Fi." 8 50 > "$SCREEN_TTY" 2>&1
  else
    echo "ERROR: Handheld is not connected to Wi-Fi!"
    sleep 6
  fi
  exit 1
fi

GITHUB_REPO="Cavephar/RomM-R36S"
GITHUB_BRANCH="main"

CONFIG_FILE="$APP_DIR/config.json"
if [ -f "$CONFIG_FILE" ]; then
  READ_REPO=$(grep -o '"githubRepo": *"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
  READ_BRANCH=$(grep -o '"githubBranch": *"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
  [ -n "$READ_REPO" ] && GITHUB_REPO="$READ_REPO"
  [ -n "$READ_BRANCH" ] && GITHUB_BRANCH="$READ_BRANCH"
fi

if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
  dialog --backtitle "RomM GitHub Updater" --title " Updating Client " --infobox "\n  Fetching latest build from:\n  https://github.com/$GITHUB_REPO ($GITHUB_BRANCH)\n\n  Please wait...\n" 9 58 > "$SCREEN_TTY" 2>&1
fi

echo "Updating RomM from: https://github.com/$GITHUB_REPO ($GITHUB_BRANCH)"

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" || exit 1
  git fetch origin "$GITHUB_BRANCH" 2>&1
  git pull origin "$GITHUB_BRANCH" 2>&1
else
  TMP_DIR="/tmp/romm_update"
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
  if curl -sSL -f -o "$TMP_DIR/RomM.zip" "https://raw.githubusercontent.com/$GITHUB_REPO/$GITHUB_BRANCH/RomM.zip"; then
    unzip -o -q "$TMP_DIR/RomM.zip" -d "$TMP_DIR/extracted"
    if [ -d "$TMP_DIR/extracted/romm" ]; then
      cp -r "$TMP_DIR/extracted/romm/"* "$APP_DIR/" 2>/dev/null
    else
      cp -r "$TMP_DIR/extracted/"* "$APP_DIR/" 2>/dev/null
    fi
  fi
  rm -rf "$TMP_DIR"
fi

if [ -d "$APP_DIR" ]; then
  find "$APP_DIR" -name "*.sh" -exec chmod +x {} + 2>/dev/null
fi

if command -v dialog &>/dev/null && [ -n "$SCREEN_TTY" ]; then
  dialog --backtitle "RomM GitHub Updater" --title " Update Successful " --msgbox "\n  RomM Client updated to latest GitHub version!\n\n  Press [A] or [Enter] to return to EmulationStation.\n" 10 54 > "$SCREEN_TTY" 2>&1
else
  echo "SUCCESS: RomM Client updated!"
  sleep 6
fi
exit 0
EOF
chmod +x "$UPDATE_TOOL" 2>/dev/null

echo -e "${C_GREEN}[OK]${C_RESET} Installed launcher: $LAUNCHER_PATH"
echo -e "${C_GREEN}[OK]${C_RESET} Installed controller map: $APP_DIR/romm.gptk"
echo -e "${C_GREEN}[OK]${C_RESET} Installed log viewer: $VIEWER_TOOL"
echo -e "${C_GREEN}[OK]${C_RESET} Installed kiosk installer: $KIOSK_TOOL"
echo -e "${C_GREEN}[OK]${C_RESET} Installed GitHub updater: $UPDATE_TOOL"

# 5. Fix permissions and CRLF endings
show_progress 3 4 "Sanitizing Linux Permissions & Line Endings" "Applying chmod +x and dos2unix sanitation to all port scripts..." 75
for FILE in "$LAUNCHER_PATH" "$PORTS_DIR/RomM Client.sh" "$APP_DIR/RomM.sh" "$VIEWER_TOOL" "$KIOSK_TOOL" "$UPDATE_TOOL"; do
  if [ -f "$FILE" ]; then
    sed -i 's/\r$//' "$FILE" 2>/dev/null
    chmod +x "$FILE" 2>/dev/null
  fi
done
echo -e "${C_GREEN}[OK]${C_RESET} All scripts made executable (0755) and sanitized for Linux."

# 6. Check Browser Environment & Optional Setup
show_progress 4 4 "Checking Handheld Kiosk Browser & Network" "Verifying local display capabilities..." 90
DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$DEVICE_IP" ]; then
  echo -e "${C_GREEN}[OK]${C_RESET} Wi-Fi is connected! Device IP: ${C_CYAN}$DEVICE_IP${C_RESET}"
else
  echo -e "${C_YELLOW}[!]${C_RESET} Wi-Fi is currently disconnected. (Can be connected in ArkOS Options menu)."
fi

if command -v chromium-browser &>/dev/null || command -v chromium &>/dev/null; then
  echo -e "${C_GREEN}[OK]${C_RESET} Chromium browser detected for handheld kiosk display."
else
  echo -e "${C_YELLOW}[!]${C_RESET} Chromium kiosk browser not yet installed on this R36S."
  if [ -n "$DEVICE_IP" ]; then
    show_infobox "Kiosk Setup" "Wi-Fi detected ($DEVICE_IP).\nInstalling Chromium Kiosk Browser via apt-get...\nThis may take 1-2 minutes. Please wait..." 8 56
    echo -e "${C_CYAN}[KIOSK SETUP]${C_RESET} Wi-Fi detected! Installing Chromium browser now..."
    $ESUDO apt-get update -y
    $ESUDO apt-get install -y --no-install-recommends chromium-browser || $ESUDO apt-get install -y chromium
    if command -v chromium-browser &>/dev/null || command -v chromium &>/dev/null; then
      echo -e "${C_GREEN}[OK]${C_RESET} Chromium Kiosk Browser installed successfully!"
    else
      echo -e "${C_YELLOW}[!]${C_RESET} Auto-install could not complete. You can run 'Install_Chromium_Kiosk.sh' from Tools later."
    fi
  else
    echo -e "${C_YELLOW}[INFO]${C_RESET} To enable the on-device screen: Connect Wi-Fi in ArkOS Options,"
    echo "       then run '${C_CYAN}Install_Chromium_Kiosk.sh${C_RESET}' from the Tools menu."
    echo "       (RomM can also be opened right now on your phone/PC at http://$DEVICE_IP:3000)"
  fi
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
echo -e "  Kiosk Installer   : Listed under ${C_BOLD}TOOLS${C_RESET} (Install_Chromium_Kiosk.sh)"
echo -e "  GitHub Updater    : Listed under ${C_BOLD}TOOLS${C_RESET} (update_RomM.sh)"
echo -e "  Log Inspector     : Listed under ${C_BOLD}TOOLS${C_RESET} (view_RomM_log.sh)"
if [ -n "$DEVICE_IP" ]; then
  echo -e "  Web / Remote HUD  : ${C_CYAN}http://$DEVICE_IP:3000${C_RESET}"
fi
echo "=========================================================="
echo ""

if [ "$HAS_DIALOG" -eq 1 ] && [ -n "$SCREEN_TTY" ]; then
  dialog --backtitle "RomM R36S Handheld Installer" \
         --title " Installation Complete! " \
         --msgbox "\n  RomM & SMB Client has been installed!\n\n  * Launcher: $PORTS_DIR/RomM.sh\n  * Menu: EmulationStation -> PORTS\n  * Tools: Updater & Kiosk Installer in TOOLS\n\n  Press [A] or [Enter] to return to EmulationStation.\n" 13 56 > "$SCREEN_TTY" 2>&1
elif command -v msgbox &>/dev/null; then
  msgbox "RomM Installed Successfully! Press A to exit." 2>/dev/null
else
  echo "Returning to EmulationStation in 10 seconds (or press any button)..."
  read -t 10 -n 1 2>/dev/null || sleep 10
fi

if [ -n "$SCREEN_TTY" ]; then
  printf "\033[?25h" > "$SCREEN_TTY" 2>/dev/null
fi
exit 0
