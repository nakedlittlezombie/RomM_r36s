# RomM & SMB Client for R36S (PortMaster Package)

A dedicated, lightweight client for browsing your self-hosted **RomM** and **SMB/NAS** library directly from your **R36S handheld console** running ArkOS or dArkOS.

---

## 🛡️ Operating System Safety (PortMaster Standard)

In accordance with [PortMaster Packaging Guidelines & FAQ](https://portmaster.games/faq.html):
1. **Zero System Pollution**: Does not modify, overwrite, or upgrade any OS libraries in `/usr/lib`, `/lib`, or system packages.
2. **Directory Isolation**: All assets, scripts, logs, and caches reside strictly within `$GAMEDIR` (`/roms/ports/romm` or `/roms2/ports/romm`).
3. **Clean Termination**: Traps `EXIT`, `SIGINT`, and `SIGTERM` to safely terminate gamepad mapping daemons (`gptokeyb`) and restore the Linux framebuffer and terminal cursor so EmulationStation re-enters smoothly without crashes or black screens.
4. **Dual-SD Compatibility**: Automatically respects either Single SD (`/roms`) or Dual SD (`/roms2`) configurations.

---

## 📂 Installation Instructions

### Option 1: Direct SD Card Placement (Fastest)
1. Extract the `RomM.zip` file onto your computer.
2. Copy `RomM Client.sh` and the `romm/` folder into:
   - **TF1 (Single SD setup)**: `E:\roms\ports\` (Linux path: `/roms/ports/`)
   - **TF2 (Dual SD setup)**: `E:\roms2\ports\` (Linux path: `/roms2/ports/`)
3. Insert the MicroSD card back into your R36S and boot up.
4. Open the **"Ports"** system menu in EmulationStation.
5. Select **RomM & SMB Client** and press **(A)** to launch!

### Option 2: PortMaster Autoinstall
1. Copy `RomM.zip` into your device's PortMaster autoinstall folder:
   - On ArkOS: `/roms/ports/PortMaster/autoinstall/` (or `/roms2/ports/PortMaster/autoinstall/`)
2. Run the **PortMaster** application from the Ports menu.
3. PortMaster will detect and install `RomM & SMB Client`.

---

## 🎮 R36S Controls & Navigation

| R36S Button | In-App Action |
|:---|:---|
| **D-Pad / Left Stick** | Navigate game list, platforms, and settings menus |
| **(A)** | Download ROM / Launch Action / Select item |
| **(B)** | Back / Cancel / Return to previous view |
| **(X)** | Sync RetroArch save states to RomM cloud |
| **(Y)** | Toggle Favorite |
| **[L1] / [R1]** | Previous / Next Platform tab |
| **[SELECT]** | Filter list (Installed, Cloud Only, Favorites) |
| **[START]** | Open Server & Network Settings |
| **[R2]** | Toggle Storage Mount (`/roms` vs `/roms2`) |
| **[L2] or [Q]** | Prompt Clean Exit to EmulationStation |
