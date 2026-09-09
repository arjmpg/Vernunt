#!/usr/bin/env bash
# Vernunt iOS App Build & IPA Export Script
# Run this on a macOS machine with Xcode 15+ installed

set -e

echo "🍎 Building Vernunt iOS Application..."

PROJECT_NAME="Vernunt"
SCHEME_NAME="Vernunt"
CONFIGURATION="Release"
ARCHIVE_PATH="./build/${PROJECT_NAME}.xcarchive"
EXPORT_PATH="./build/ipa"
EXPORT_OPTIONS_PLIST="./exportOptions.plist"

mkdir -p build/ipa

echo "📦 Archiving project..."
xcodebuild clean archive \
  -project "${PROJECT_NAME}.xcodeproj" \
  -scheme "${SCHEME_NAME}" \
  -configuration "${CONFIGURATION}" \
  -archivePath "${ARCHIVE_PATH}" \
  -destination "generic/platform=iOS" \
  CODE_SIGNING_ALLOWED=NO

echo "📄 Creating ExportOptions.plist for Ad-Hoc / Development..."
cat <<EOF > ${EXPORT_OPTIONS_PLIST}
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

echo "✨ Exporting Vernunt.ipa..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -allowProvisioningUpdates

echo "✅ Vernunt.ipa successfully generated in ${EXPORT_PATH}/Vernunt.ipa!"
