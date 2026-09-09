#!/usr/bin/env bash
set -e

echo "=========================================="
echo "  Building Vernunt Android Release APK   "
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ANDROID_JAR="/opt/android-sdk/platforms/android-33/android.jar"
R8_JAR="/opt/android-sdk/build-tools/r8.jar"

if [ ! -f "$ANDROID_JAR" ] || [ ! -f "$R8_JAR" ]; then
  echo "Error: Android build tools not found in /opt/android-sdk"
  exit 1
fi

mkdir -p "$WORKSPACE_ROOT/android/gen"
mkdir -p "$WORKSPACE_ROOT/android/bin"

echo "1. Generating R.java from Android Resources..."
aapt package -f -m \
  -J "$WORKSPACE_ROOT/android/gen" \
  -S "$WORKSPACE_ROOT/android/app/src/main/res" \
  -M "$WORKSPACE_ROOT/android/app/src/main/AndroidManifest.xml" \
  -I "$ANDROID_JAR"

echo "2. Compiling Java Source Files..."
javac -source 8 -target 8 \
  -cp "$ANDROID_JAR" \
  -d "$WORKSPACE_ROOT/android/bin" \
  "$WORKSPACE_ROOT/android/gen/com/vernunt/app/R.java" \
  "$WORKSPACE_ROOT/android/app/src/main/java/com/vernunt/app/"*.java

echo "3. Dexing classes into classes.dex with D8..."
cd "$WORKSPACE_ROOT/android/bin"
CLASS_FILES=$(find . -name "*.class")
java -cp "$R8_JAR" com.android.tools.r8.D8 \
  --output "$WORKSPACE_ROOT/android/bin" \
  --lib "$ANDROID_JAR" \
  $CLASS_FILES

echo "4. Packaging Android Manifest and Resources into APK..."
cd "$WORKSPACE_ROOT"
rm -f "$WORKSPACE_ROOT/android/bin/unaligned.apk" "$WORKSPACE_ROOT/android/bin/aligned.apk"
aapt package -f \
  -M "$WORKSPACE_ROOT/android/app/src/main/AndroidManifest.xml" \
  -S "$WORKSPACE_ROOT/android/app/src/main/res" \
  -I "$ANDROID_JAR" \
  -F "$WORKSPACE_ROOT/android/bin/unaligned.apk"

echo "5. Adding classes.dex to APK..."
cd "$WORKSPACE_ROOT/android/bin"
aapt add unaligned.apk classes.dex

echo "6. Aligning APK with zipalign..."
zipalign -f -v -p 4 "$WORKSPACE_ROOT/android/bin/unaligned.apk" "$WORKSPACE_ROOT/android/bin/aligned.apk"

echo "7. Signing APK with production Keystore (v1, v2, v3 schemes)..."
KEYSTORE="$WORKSPACE_ROOT/android/keystore/vernunt-release-key.jks"
if [ ! -f "$KEYSTORE" ]; then
  mkdir -p "$WORKSPACE_ROOT/android/keystore"
  keytool -genkeypair -v -keystore "$KEYSTORE" \
    -alias vernunt -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass vernunt2026 -keypass vernunt2026 \
    -dname "CN=Vernunt Technologies, OU=Mobile, O=Vernunt, L=Bangalore, ST=Karnataka, C=IN"
fi

if command -v apksigner >/dev/null 2>&1; then
  echo "Signing with apksigner (v1, v2, v3 schemes)..."
  apksigner sign --ks "$KEYSTORE" \
    --ks-pass pass:vernunt2026 \
    --ks-key-alias vernunt \
    --key-pass pass:vernunt2026 \
    "$WORKSPACE_ROOT/android/bin/aligned.apk"
  echo "8. Verifying APK signature..."
  apksigner verify --verbose "$WORKSPACE_ROOT/android/bin/aligned.apk"
else
  echo "apksigner not found, falling back to jarsigner..."
  jarsigner -sigalg SHA256withRSA -digestalg SHA-256 \
    -keystore "$KEYSTORE" \
    -storepass vernunt2026 -keypass vernunt2026 \
    "$WORKSPACE_ROOT/android/bin/aligned.apk" vernunt
  echo "8. Verifying APK signature..."
  jarsigner -verify "$WORKSPACE_ROOT/android/bin/aligned.apk"
fi

# Copy output to public for direct web app download
cp "$WORKSPACE_ROOT/android/bin/aligned.apk" "$WORKSPACE_ROOT/public/vernunt.apk"
cp "$WORKSPACE_ROOT/android/bin/aligned.apk" "$WORKSPACE_ROOT/android/vernunt-release.apk"

echo "=========================================="
echo " SUCCESS! Vernunt Android APK Built!"
echo " Output location: public/vernunt.apk"
echo " Size: $(ls -lh "$WORKSPACE_ROOT/public/vernunt.apk" | awk '{print $5}')"
echo "=========================================="
