#!/bin/bash

# Time Tracker - Easy Installation Script for Ubuntu 22

echo "======================================"
echo "Time Tracker Installation Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run with sudo (this script needs admin privileges)"
  echo "Usage: sudo ./install.sh"
  exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEB_FILE="$SCRIPT_DIR/dist-electron/time-tracker_1.0.0_amd64.deb"

# Check if DEB file exists
if [ ! -f "$DEB_FILE" ]; then
  echo "Error: time-tracker_1.0.0_amd64.deb not found in dist-electron/"
  echo "Please build the app first using: pnpm electron:dist"
  exit 1
fi

echo "Found installation file: $DEB_FILE"
echo ""

# Install the DEB package
echo "Installing Time Tracker..."
dpkg -i "$DEB_FILE"

# Fix any dependency issues
echo ""
echo "Fixing dependencies (if any)..."
apt-get install -f -y

echo ""
echo "======================================"
echo "Installation Complete! ✓"
echo "======================================"
echo ""
echo "You can now run Time Tracker by:"
echo "  1. Searching for 'Time Tracker' in your applications menu"
echo "  2. Running 'time-tracker' from the terminal"
echo ""
echo "To uninstall, run: sudo apt-get remove time-tracker"
echo ""
