# Debug (Android)
When debugging the app on a connected Android device:

1. **Build and deploy** to the connected device:
   ```bash
   JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home npm run android:deploy
   ```

2. **Watch logcat** for app logs (filtered to the app's webview):
   ```bash
   adb logcat -s chromium:* CapacitorHttp:* AdMob:* CapacitorConsole:* | grep -E '\[AD-DEBUG\]|ERROR|WARN|console'
   ```

3. **Common log filters**:
   - AdMob: `adb logcat -s Ads:* AdMob:*`
   - Capacitor: `adb logcat -s Capacitor:* CapacitorConsole:*`
   - JS console: `adb logcat chromium:D | grep -i console`
   - All app logs: `adb logcat -s chromium:* Capacitor:* Ads:* AdMob:*`

4. **Quick device check**: `adb devices` to verify device is connected

5. **Clear logcat** before testing: `adb logcat -c`

6. When reporting findings, include relevant log lines and timestamps.

7. If the build fails, check:
   - JAVA_HOME is set correctly
   - Device is connected (`adb devices`)
   - USB debugging is enabled on the device
