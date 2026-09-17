#!/bin/bash
# ==============================================================================
# RomM R36S Handheld Client - GitHub Live Updater
# ArkOS / PortMaster / RK3326 Handheld
# ==============================================================================

# Ensure screen output is visible on handheld framebuffer console
if [ -c /dev/tty0 ]; then
  printf "\033[2J\033[H" > /dev/tty0 2>/dev/null
  exec > /dev/tty0 2>&1
fi

ESUDO="sudo"
[ "$(id -u)" -eq 0 ] && ESUDO=""

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
  # Check relative path
  SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)"
  if [ -f "$SCRIPT_PATH/RomM.sh" ]; then
    APP_DIR="$SCRIPT_PATH"
  fi
fi

echo "Target Application Directory: ${APP_DIR:-/roms2/ports/romm}"

# 2. Check Network / Wi-Fi Connectivity
DEVICE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$DEVICE_IP" ]; then
  echo ""
  echo "ERROR: Handheld is not connected to Wi-Fi!"
  echo "Please connect to Wi-Fi first in:"
  echo "EmulationStation -> Options / Tools -> Wi-Fi"
  echo ""
  echo "Returning to EmulationStation in 6 seconds..."
  sleep 6
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
echo ""

# Stop any running background RomM node server before updating
echo "Stopping any active RomM background server..."
killall node 2>/dev/null
pkill -f "node.*server" 2>/dev/null
sleep 1

# 4. Check if directory is a git repository
if [ -d "$APP_DIR/.git" ]; then
  echo "Git repository detected! Performing git pull update..."
  cd "$APP_DIR" || exit 1
  
  echo "1) Fetching latest changes from origin..."
  git fetch origin "$GITHUB_BRANCH" 2>&1
  
  echo "2) Pulling updates..."
  git pull origin "$GITHUB_BRANCH" 2>&1
  GIT_STATUS=$?
  
  if [ $GIT_STATUS -eq 0 ]; then
    echo ""
    echo "=========================================================="
    echo " SUCCESS: Git repository updated to latest commit!"
    echo "=========================================================="
  else
    echo "WARNING: git pull exited with code $GIT_STATUS."
    echo "Attempting to reset local changes and pull..."
    git stash 2>/dev/null
    git pull origin "$GITHUB_BRANCH" 2>&1
  fi

else
  # 5. Non-git install: Download latest release bundle or zip from GitHub
  echo "Stand-alone installation detected. Fetching update from GitHub..."
  
  TMP_DIR="/tmp/romm_update"
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
  
  DOWNLOAD_URL="https://raw.githubusercontent.com/$GITHUB_REPO/$GITHUB_BRANCH/RomM.zip"
  
  echo "Downloading update package from GitHub:"
  echo ">>> $DOWNLOAD_URL"
  
  if curl -sSL -f -o "$TMP_DIR/RomM.zip" "$DOWNLOAD_URL"; then
    echo "[OK] Downloaded RomM.zip successfully."
    echo "Extracting updated files into $APP_DIR..."
    unzip -o -q "$TMP_DIR/RomM.zip" -d "$TMP_DIR/extracted"
    
    # Copy files over
    if [ -d "$TMP_DIR/extracted/romm" ]; then
      cp -r "$TMP_DIR/extracted/romm/"* "$APP_DIR/" 2>/dev/null
    else
      cp -r "$TMP_DIR/extracted/"* "$APP_DIR/" 2>/dev/null
    fi
    
    echo ""
    echo "=========================================================="
    echo " SUCCESS: RomM client updated successfully from GitHub!"
    echo "=========================================================="
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
      echo "=========================================================="
      echo " SUCCESS: Updated from GitHub repository branch $GITHUB_BRANCH!"
      echo "=========================================================="
    else
      echo "ERROR: Unable to download update from GitHub."
      echo "Please verify that the repository https://github.com/$GITHUB_REPO is public"
      echo "or your Wi-Fi connection is stable."
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

echo ""
echo "Returning to EmulationStation in 5 seconds (or press any button)..."
read -t 5 -n 1
exit 0
