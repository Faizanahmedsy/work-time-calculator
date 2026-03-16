#!/bin/bash

# Build script for Android - creates static export for Capacitor
echo "Building Next.js app for Android..."

# Create a temporary static export
rm -rf ./android-export 2>/dev/null
mkdir -p ./android-export

# Copy the standalone build's public folder
cp -r .next/standalone/public/* ./android-export/ 2>/dev/null || true

# If no files copied, do a regular export
if [ ! -f "./android-export/index.html" ]; then
  echo "Creating static export..."
  # Temporarily modify next.config.js for static export
  cp next.config.js next.config.js.backup
  
  cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    domains: ["cdn.builder.io"],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
EOF
  
  pnpm build
  
  # Restore original config
  mv next.config.js.backup next.config.js
  
  # Copy exported files
  if [ -d "./out" ]; then
    cp -r ./out/* ./android-export/
  fi
fi

echo "Android build files ready in ./android-export"
