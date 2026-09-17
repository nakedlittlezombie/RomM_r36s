#!/bin/bash
# ==============================================================================
# RomM R36S Handheld Client - GitHub Live Updater
# ArkOS / PortMaster / RK3326 Handheld
# ==============================================================================

if [ -z "$BASH_VERSION" ]; then
  exec /bin/bash "$0" "$@"
fi

ESUDO="sudo"
[ "$(id -u)" -eq 0 ] && ESUDO=""

# Framebuffer and terminal initialization
$ESUDO chmod 666 /dev/tty0 /dev/tty1 /dev/console 2>/dev/null
$ESUDO chvt 1 2>/dev/null
if [ -w /sys/class/graphics/fb0/blank ]; then
  echo 0 > /sys/class/graphics/fb0/blank 2>/dev/null
elif [ -n "$ESUDO" ]; then
  echo 0 | $ESUDO tee /sys/class/graphics/fb0/blank >/dev/null 2>&1
fi
$ESUDO setterm -blank 0 -powersave off -powerdown 0 </dev/tty1 >/dev/tty1 2>/dev/null

SCREEN_TTY=""
for t in /dev/tty1 /dev/tty0 /dev/console; do
  if [ -c "$t" ] && [ -w "$t" ]; then
    SCREEN_TTY="$t"
    break
  fi
done

if [ -n "$SCREEN_TTY" ]; then
  printf "\033[?25h\033[0m" > "$SCREEN_TTY" 2>/dev/null
fi

if [ -n "$SCREEN_TTY" ] && [ ! -t 1 ]; then
  "$0" --attached "$@" 2>&1 | (tee "$SCREEN_TTY" 2>/dev/null || cat)
  exit $?
fi
if [ "$1" = "--attached" ]; then shift; fi

HAS_DIALOG=0
if command -v dialog &>/dev/null; then
  HAS_DIALOG=1
fi

show_info() {
  local title="$1"
  local text="$2"
  if [ "$HAS_DIALOG" -eq 1 ] && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM GitHub Updater" --title " $title " --infobox "\n  $text\n" 7 54 > "$SCREEN_TTY" 2>&1
  fi
}

echo "=========================================================="
echo "          RomM R36S Client - GitHub Updater              "
echo "=========================================================="
echo ""

# 1. Detect Handheld Storage Mount and Port directory
APP_DIR=""
if [ -d "/roms2/ports/romm" ]; then
  APP_DIR="/roms2/ports/romm"
elif [ -d "/roms/ports/romm" ]; then
  APP_DIR="/roms/ports/romm"
elif [ -d "$(dirname "$0")/ports/romm" ]; then
  APP_DIR="$(dirname "$0")/ports/romm"
else
  SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)"
  if [ -f "$SCRIPT_PATH/RomM.sh" ]; then
    APP_DIR="$SCRIPT_PATH"
  fi
fi

echo "Target Application Directory: ${APP_DIR:-/roms2/ports/romm}"

show_info "Network Check" "Connecting to Wi-Fi..."

# 2. Check Network / Wi-Fi Connectivity
DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$DEVICE_IP" ]; then
  echo ""
  echo "ERROR: Handheld is not connected to Wi-Fi!"
  if [ "$HAS_DIALOG" -eq 1 ] && [ -n "$SCREEN_TTY" ]; then
    dialog --backtitle "RomM GitHub Updater" --title " Wi-Fi Disconnected " --msgbox "\n  Wi-Fi is NOT connected.\n\n  Please connect via EmulationStation -> Options -> Wi-Fi,\n  then run this updater again.\n" 10 54 > "$SCREEN_TTY" 2>&1
  else
    echo "Please connect to Wi-Fi first in: EmulationStation -> Options / Tools -> Wi-Fi"
    sleep 6
  fi
  exit 1
fi

echo "Handheld IP: $DEVICE_IP (Network Online)"
echo ""

# 3. Read configured repository or fallback to default
GITHUB_REPO="Cavephar/RomM-R36S"
GITHUB_BRANCH="main"

CONFIG_FILE="$APP_DIR/config.json"
if [ -f "$CONFIG_FILE" ]; then
  CFG_REPO=$(grep -o '"githubRepo"[^,]*' "$CONFIG_FILE" 2>/dev/null | cut -d'"' -f4)
  [ -n "$CFG_REPO" ] && GITHUB_REPO="$CFG_REPO"
  CFG_BRANCH=$(grep -o '"githubBranch"[^,]*' "$CONFIG_FILE" 2>/dev/null | cut -d'"' -f4)
  [ -n "$CFG_BRANCH" ] && GITHUB_BRANCH="$CFG_BRANCH"
fi

echo "GitHub Target: https://github.com/$GITHUB_REPO (branch: $GITHUB_BRANCH)"
show_info "Checking Updates" "Connecting to GitHub ($GITHUB_REPO)...\nPlease wait."

# Stop any running background RomM node server before updating
echo "Stopping any active RomM background server..."
killall node 2>/dev/null
pkill -f "node.*server" 2>/dev/null
sleep 1

# 4. Check if directory is a git repository
if [ -d "$APP_DIR/.git" ]; then
  echo "Git repository detected! Performing git pull update..."
  show_info "Git Pull" "Fetching and pulling latest commits from origin/$GITHUB_BRANCH..."
  cd "$APP_DIR" || exit 1
  
  echo "1) Fetching latest changes from origin..."
  git fetch origin "$GITHUB_BRANCH" 2>&1
  
  echo "2) Pulling updates..."
  git pull origin "$GITHUB_BRANCH" 2>&1
  GIT_STATUS=$?
  
  if [ $GIT_STATUS -eq 0 ]; then
    echo "SUCCESS: Git repository updated to latest commit!"
  else
    echo "WARNING: Attempting stash & pull..."
    git stash 2>/dev/null
    git pull origin "$GITHUB_BRANCH" 2>&1
  fi

else
  # 5. Non-git install: Download latest release bundle or zip from GitHub
  echo "Stand-alone installation detected. Fetching update from GitHub..."
  show_info "Downloading Bundle" "Fetching latest RomM bundle from GitHub..."
  
  TMP_DIR="/tmp/romm_update"
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
  
  DOWNLOAD_URL="https://raw.githubusercontent.com/$GITHUB_REPO/$GITHUB_BRANCH/RomM.zip"
  echo "Downloading update package from GitHub: $DOWNLOAD_URL"
  
  if curl -sSL -f -o "$TMP_DIR/RomM.zip" "$DOWNLOAD_URL"; then
    echo "[OK] Downloaded RomM.zip successfully."
    show_info "Extracting" "Extracting files to $APP_DIR..."
    unzip -o -q "$TMP_DIR/RomM.zip" -d "$TMP_DIR/extracted"
    
    if [ -d "$TMP_DIR/extracted/romm" ]; then
      cp -r "$TMP_DIR/extracted/romm/"* "$APP_DIR/" 2>/dev/null
    else
      cp -r "$TMP_DIR/extracted/"* "$APP_DIR/" 2>/dev/null
    fi
    echo "SUCCESS: RomM client updated successfully from GitHub!"
  else
    echo "Direct RomM.zip download not found. Attempting repository archive zip..."
    ARCHIVE_URL="https://github.com/$GITHUB_REPO/archive/refs/heads/$GITHUB_BRANCH.zip"
    if curl -sSL -f -o "$TMP_DIR/repo.zip" "$ARCHIVE_URL"; then
      unzip -o -q "$TMP_DIR/repo.zip" -d "$TMP_DIR/repo_extracted"
      EXTRACTED_SUBDIR=$(find "$TMP_DIR/repo_extracted" -mindepth 1 -maxdepth 1 -type d | head -n 1)
      if [ -d "$EXTRACTED_SUBDIR/portmaster/romm" ]; then
        cp -r "$EXTRACTED_SUBDIR/portmaster/romm/"* "$APP_DIR/" 2>/dev/null
      elif [ -d "$EXTRACTED_SUBDIR/dist" ]; then
        cp -r "$EXTRACTED_SUBDIR/dist" "$APP_DIR/" 2>/dev/null
      fi
      echo "SUCCESS: Updated from GitHub repository branch $GITHUB_BRANCH!"
    else
      echo "ERROR: Unable to download update from GitHub."
      if [ "$HAS_DIALOG" -eq 1 ] && [ -n "$SCREEN_TTY" ]; then
        dialog --backtitle "RomM GitHub Updater" --title " Download Failed " --msgbox "Unable to download from GitHub.\nPlease check Wi-Fi or repo permissions." 8 50 > "$SCREEN_TTY" 2>&1
      fi
    fi
  fi
  
  rm -rf "$TMP_DIR"
fi

# 6. Ensure executable permissions
if [ -d "$APP_DIR" ]; then
  find "$APP_DIR" -name "*.sh" -exec chmod +x {} + 2>/dev/null
fi
if [ -f "/roms2/ports/RomM.sh" ]; then
  chmod +x "/roms2/ports/RomM.sh" 2>/dev/null
fi
if [ -f "/roms/ports/RomM.sh" ]; then
  chmod +x "/roms/ports/RomM.sh" 2>/dev/null
fi

if [ "$HAS_DIALOG" -eq 1 ] && [ -n "$SCREEN_TTY" ]; then
  dialog --backtitle "RomM GitHub Updater" --title " Update Complete " --msgbox "\n  RomM Client updated successfully to latest build!\n\n  Press [A] or [Enter] to return to EmulationStation.\n" 10 56 > "$SCREEN_TTY" 2>&1
else
  echo ""
  echo "=========================================================="
  echo " SUCCESS: RomM update complete!"
  echo " Returning to EmulationStation in 5 seconds..."
  echo "=========================================================="
  read -t 5 -n 1
fi

exit 0
