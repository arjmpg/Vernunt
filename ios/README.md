# Vernunt iOS App - Official Source & Distribution Package

Welcome to the official iOS repository bundle for **Vernunt** (`com.vernunt.app`).

## Three Ways to Run & Install on iPhone / iPad

### Option 1: Direct 1-Tap iOS Web Clip Profile (.mobileconfig) — No Mac Required!
Apple natively supports Mobile Configuration Profiles (`.mobileconfig`). 
When users open `https://app.vernunt.com/vernunt.mobileconfig` on their iPhone:
1. Tap **Allow** to download the configuration profile.
2. Go to iPhone **Settings** → **Profile Downloaded** → **Vernunt**.
3. Tap **Install** and enter your passcode.
4. The Vernunt native home screen app icon immediately appears on your iOS home screen!

### Option 2: Safari 2-Tap "Add to Home Screen" (PWA / Web App)
1. Open `https://app.vernunt.com` in **Safari** on your iPhone.
2. Tap the **Share** button (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right. Vernunt is now installed on your iOS home screen with push notifications enabled!

### Option 3: Compile Signed Native .IPA with Xcode
For Apple Developer account holders, enterprise distribution, or App Store submission:
1. Open `ios/Vernunt` in Xcode on macOS.
2. Select your Apple Developer Signing Team under **Signing & Capabilities**.
3. Connect your iPhone via USB or select Any iOS Device.
4. Click **Product → Archive**, or run `./build-ipa.sh`.
5. Export as **Ad-Hoc**, **Enterprise**, or upload directly to **TestFlight / App Store Connect**.
