import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const cwd = process.cwd();
const publicDir = path.join(cwd, 'public');
const mobileConfigPath = path.join(publicDir, 'vernunt.mobileconfig');
const zipOutPath = path.join(publicDir, 'vernunt-ios-project.zip');

// 1. Generate vernunt.mobileconfig
const iconPath = path.join(publicDir, 'apple-touch-icon.png');
let iconBase64 = '';
if (fs.existsSync(iconPath)) {
  iconBase64 = fs.readFileSync(iconPath).toString('base64');
}

const mobileConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            ${iconBase64 ? `<key>Icon</key>\n            <data>\n                ${iconBase64}\n            </data>` : ''}
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>Vernunt</string>
            <key>PayloadDescription</key>
            <string>Installs Vernunt Parenting &amp; Playdate App on iOS Home Screen</string>
            <key>PayloadDisplayName</key>
            <string>Vernunt</string>
            <key>PayloadIdentifier</key>
            <string>com.vernunt.app.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>E7C8B490-58F9-41C4-B1F7-22879D5C75A1</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>https://app.vernunt.com/</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Vernunt - India's #1 Parenting, Playdate Discovery, and Pediatric Healthcare App for iOS</string>
    <key>PayloadDisplayName</key>
    <string>Vernunt iOS App Profile</string>
    <key>PayloadIdentifier</key>
    <string>com.vernunt.app.mobileconfig</string>
    <key>PayloadOrganization</key>
    <string>Vernunt Kids Network</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>A1B2C3D4-E5F6-7890-ABCD-EF1234567890</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
`;

fs.writeFileSync(mobileConfigPath, mobileConfigXml, 'utf8');
console.log('✅ Generated public/vernunt.mobileconfig');

// 2. Generate vernunt-ios-project.zip using pure Node archiver
async function generateIosZip() {
  const iosDir = path.join(cwd, 'ios');
  if (!fs.existsSync(iosDir)) {
    console.log('ℹ️ iOS source directory not present, skipping zip generation.');
    return;
  }
  return new Promise((resolve) => {
    const output = fs.createWriteStream(zipOutPath);
    const archive = new ZipArchive();

    output.on('close', () => {
      console.log(`✅ Generated public/vernunt-ios-project.zip (${archive.pointer()} total bytes)`);
      resolve();
    });

    output.on('error', (err) => {
      console.error('Failed to create iOS zip archive:', err);
      resolve();
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      resolve();
    });

    archive.pipe(output);
    archive.directory(iosDir, false);
    archive.finalize();
  });
}

await generateIosZip();
