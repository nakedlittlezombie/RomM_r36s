#!/bin/bash
# ==============================================================================
# PortMaster Packaging Script for RomM & SMB Client (R36S / dArkOS)
# ==============================================================================

set -e

echo "[1/3] Building production bundle..."
npm run build

echo "[2/3] Staging PortMaster distribution files..."
mkdir -p portmaster/romm/dist
cp -r dist/* portmaster/romm/dist/
chmod +x "portmaster/RomM Client.sh"

echo "[3/3] Packaging RomM.zip with JSZip..."
node package_portmaster.js

echo "PortMaster package build successful!"
