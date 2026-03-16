# Time Tracker - Electron Desktop App for Ubuntu 22

Your Next.js Time Tracker app is now an Electron desktop application that can be installed on Ubuntu 22!

## 📦 Downloadable Files Created

Two installation formats are available in the `dist-electron/` directory:

### 1. **DEB Package** (Recommended for Ubuntu)

- **File**: `dist-electron/time-tracker_1.0.0_amd64.deb`
- **Size**: ~220 MB
- **Best for**: Permanent installation on Ubuntu/Debian systems

### 2. **AppImage** (Portable)

- **File**: `dist-electron/TimeTracker-1.0.0.AppImage`
- **Size**: ~343 MB
- **Best for**: Portable use, no installation required

---

## 💾 How to Install on Ubuntu 22

### Option 1: Installing the DEB Package (Recommended)

```bash
# Navigate to the dist-electron directory
cd dist-electron

# Install using dpkg
sudo dpkg -i time-tracker_1.0.0_amd64.deb

# If there are dependency issues, fix them with:
sudo apt-get install -f
```

**Or simply double-click the .deb file** in your file manager and click "Install".

### Option 2: Using the AppImage (No Installation)

```bash
# Navigate to the dist-electron directory
cd dist-electron

# Make it executable (only needed once)
chmod +x TimeTracker-1.0.0.AppImage

# Run it
./TimeTracker-1.0.0.AppImage
```

---

## 🚀 How to Run After Installation

### If you installed the DEB package:

- Click on the application menu and search for "Time Tracker"
- Or run from terminal: `time-tracker`

### If you're using AppImage:

- Double-click the AppImage file
- Or run from terminal: `./TimeTracker-1.0.0.AppImage`

---

## 📤 How to Share with Others

### Method 1: Direct File Sharing (Simple)

**For DEB package:**

1. Share the `time-tracker_1.0.0_amd64.deb` file via:

   - USB drive
   - Local network
   - Cloud storage (Google Drive, Dropbox, etc.)
   - Email (if under size limit)

2. Recipients install it by:
   ```bash
   sudo dpkg -i time-tracker_1.0.0_amd64.deb
   sudo apt-get install -f
   ```

**For AppImage:**

1. Share the `TimeTracker-1.0.0.AppImage` file
2. Recipients make it executable and run:
   ```bash
   chmod +x TimeTracker-1.0.0.AppImage
   ./TimeTracker-1.0.0.AppImage
   ```

### Method 2: GitHub Releases (Recommended for Distribution)

1. Create a GitHub repository (if you don't have one already)
2. Create a new release
3. Upload both files as release assets:
   - `time-tracker_1.0.0_amd64.deb`
   - `TimeTracker-1.0.0.AppImage`
4. Share the release URL with users

Example:

```bash
# Install gh CLI tool
sudo apt install gh

# Create a release
gh release create v1.0.0 \
  dist-electron/time-tracker_1.0.0_amd64.deb \
  dist-electron/TimeTracker-1.0.0.AppImage \
  --title "Version 1.0.0" \
  --notes "Initial release of Time Tracker desktop app"
```

### Method 3: Host on Your Website/Server

Upload the files to your web server and provide download links:

```bash
# Example Apache/Nginx setup
sudo cp dist-electron/time-tracker_1.0.0_amd64.deb /var/www/html/downloads/
sudo cp dist-electron/TimeTracker-1.0.0.AppImage /var/www/html/downloads/
```

Then share the download URLs with users.

### Method 4: Snap Store (Advanced)

You can also publish to the Snap Store for wider distribution (requires additional setup).

---

## 🔧 Development Commands

### Run in Development Mode

```bash
pnpm electron:dev
```

### Build for Production

```bash
# Build DEB package
pnpm electron:dist

# Build AppImage
pnpm electron:dist-appimage

# Build both
pnpm build && pnpm electron-builder --linux
```

---

## 📝 Notes

- **System Requirements**: Ubuntu 22.04 or compatible Debian-based Linux
- **Architecture**: x64 (AMD64)
- **Dependencies**: The DEB package includes most dependencies, but requires basic system libraries
- **Storage**: ~350 MB disk space required

---

## 🐛 Troubleshooting

### DEB Installation Issues

If you get errors during DEB installation:

```bash
sudo apt-get update
sudo apt-get install -f
sudo dpkg -i time-tracker_1.0.0_amd64.deb
```

### AppImage Won't Run

Make sure it's executable:

```bash
chmod +x TimeTracker-1.0.0.AppImage
```

### Missing Dependencies

The app bundles most dependencies. If you encounter issues:

```bash
sudo apt-get install gconf2 gconf-service
```

---

## 📞 Support

For issues or questions, please contact: support@timetracker.com

---

**Enjoy your Time Tracker desktop app! ⏰**
