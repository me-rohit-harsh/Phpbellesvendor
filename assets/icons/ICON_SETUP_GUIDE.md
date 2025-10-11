# App Icon Setup Guide - PHPBell

This guide explains the complete app icon setup for both iOS and Android with dark and light mode support.

## 📁 File Structure

```
assets/
├── icon.svg                    # Original icon (kept for compatibility)
├── icon-light.svg             # Light mode icon
├── icon-dark.svg              # Dark mode icon
├── icon-dark-foreground.svg   # Android adaptive icon foreground for dark mode
└── icons/
    ├── ios/
    │   ├── Contents.json       # iOS icon configuration
    │   ├── light/              # Light mode PNG icons
    │   │   ├── icon-1024.png   # App Store icon
    │   │   ├── icon-180.png    # iPhone app icon
    │   │   ├── icon-120.png    # iPhone app icon (2x)
    │   │   ├── icon-87.png     # iPhone notification icon
    │   │   ├── icon-80.png     # iPad spotlight icon
    │   │   ├── icon-76.png     # iPad app icon
    │   │   ├── icon-60.png     # iPhone spotlight icon
    │   │   ├── icon-58.png     # iPhone settings icon
    │   │   ├── icon-40.png     # iPad spotlight icon
    │   │   ├── icon-29.png     # iPhone/iPad settings icon
    │   │   └── icon-20.png     # iPad notification icon
    │   └── dark/               # Dark mode PNG icons (same sizes)
    └── android/
        ├── light/              # Light mode PNG icons
        │   ├── icon-512.png    # Play Store icon
        │   ├── icon-192.png    # XXXHDPI launcher icon
        │   ├── icon-144.png    # XXHDPI launcher icon
        │   ├── icon-96.png     # XHDPI launcher icon
        │   ├── icon-72.png     # HDPI launcher icon
        │   ├── icon-48.png     # MDPI launcher icon
        │   └── icon-36.png     # LDPI launcher icon
        └── dark/               # Dark mode PNG icons (same sizes)
```

## ⚙️ Configuration

### app.json Updates

1. **Global Icon Settings:**
   - Main icon: `./assets/icon-light.svg`
   - User interface style: `automatic` (supports both light and dark)

2. **iOS Configuration:**
   - Icon: `./assets/icons/ios/light/icon-1024.png`
   - Dark mode support via `Contents.json`

3. **Android Configuration:**
   - Adaptive icon foreground: `./assets/icon-light.svg`
   - Background color: `#FF6B35`
   - Monochrome image: `./assets/icon-dark-foreground.svg`
   - Standard icon: `./assets/icons/android/light/icon-192.png`

## 📐 Icon Sizes

### iOS Icon Sizes
- **1024x1024px** - App Store and iTunes Connect
- **180x180px** - iPhone App Icon (iOS 7-15, @3x)
- **120x120px** - iPhone App Icon (iOS 7-15, @2x)
- **87x87px** - iPhone Settings Icon (@3x)
- **80x80px** - iPad Settings Icon (@2x)
- **76x76px** - iPad App Icon (iOS 7-15, @1x)
- **60x60px** - iPhone App Icon (iOS 7-15, @1x)
- **58x58px** - iPhone Settings Icon (@2x)
- **40x40px** - iPad Settings Icon (@1x)
- **29x29px** - iPhone Settings Icon (@1x)
- **20x20px** - iPad Notification Icon (@1x)

### Android Icon Sizes
- **512x512px** - Google Play Store
- **192x192px** - XXXHDPI (4.0x)
- **144x144px** - XXHDPI (3.0x)
- **96x96px** - XHDPI (2.0x)
- **72x72px** - HDPI (1.5x)
- **48x48px** - MDPI (1.0x)
- **36x36px** - LDPI (0.75x)

## 🎨 Icon Design

### Light Mode
- Background: Orange (`#FF6B35`)
- Bowl/Plate: White with light cream tones
- Food items: Vibrant colors (gold, orange)
- Garnish: Green accents
- Steam: White with opacity
- Text: White

### Dark Mode
- Background: Dark gray (`#1A1A1A`)
- Bowl/Plate: Dark gray tones
- Food items: Same vibrant colors (maintained for contrast)
- Garnish: Slightly brighter green
- Steam: Light gray with higher opacity
- Text: White

## 🧪 Testing Instructions

### iOS Testing

1. **Build and Install:**
   ```bash
   npx eas build -p ios --profile preview
   ```

2. **Test Light/Dark Mode:**
   - Go to Settings > Display & Brightness
   - Toggle between Light and Dark appearance
   - Check home screen icon changes
   - Verify icon appears correctly in:
     - Home screen
     - App Library
     - Settings > General > iPhone Storage
     - Spotlight search

### Android Testing

1. **Build and Install:**
   ```bash
   npx eas build -p android --profile preview
   ```

2. **Test Adaptive Icons:**
   - Go to Settings > Display > Dark theme
   - Toggle dark theme on/off
   - Check launcher icon adapts to theme
   - Test different launcher shapes (if supported)
   - Verify icon appears correctly in:
     - Home screen
     - App drawer
     - Recent apps
     - Settings > Apps

### Development Testing

1. **Local iOS Testing:**
   ```bash
   npx expo run:ios
   ```

2. **Local Android Testing:**
   ```bash
   npx expo run:android
   ```

## 📱 Platform-Specific Notes

### iOS
- Uses `Contents.json` for proper dark/light mode icon switching
- Requires specific sizes for different device types and use cases
- Icons are automatically selected based on system appearance

### Android
- Uses adaptive icons for modern Android versions (API 26+)
- Monochrome image provides themed icon support (Android 13+)
- Background color is used for adaptive icon background
- Falls back to standard PNG for older Android versions

## 🔧 Troubleshooting

### Icons Not Updating
1. Clear app cache and data
2. Uninstall and reinstall the app
3. Restart the device
4. Check if the build includes the latest icon files

### Dark Mode Not Working
1. Verify `userInterfaceStyle` is set to `"automatic"` in app.json
2. Check that both light and dark icon variants exist
3. Ensure device/simulator supports dark mode

### Android Adaptive Icons Issues
1. Test on Android 8.0+ devices
2. Verify adaptive icon configuration in app.json
3. Check that foreground image has transparent background

## 🚀 Next Steps

1. Test on physical devices with different Android versions
2. Test on various iOS devices (iPhone, iPad)
3. Verify icons in app stores (Play Store, App Store)
4. Consider creating additional icon variants for special occasions

## 📝 Notes

- All PNG icons are generated from SVG sources for consistency
- SVG icons provide scalability and smaller file sizes
- The setup supports future icon updates by regenerating PNGs from SVGs
- Icons follow platform-specific design guidelines