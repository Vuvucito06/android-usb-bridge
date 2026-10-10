#!/usr/bin/env bash
# Builds cafe.apk without Gradle. Only needed if you change the Android app,
# because a ready-made cafe.apk is committed next to this script.
#
# Needs: JDK 17+ and the Android SDK with "build-tools;34.0.0" and
# "platforms;android-34". Set ANDROID_HOME to the SDK folder.
# After changing the app, bump android:versionCode in AndroidManifest.xml so
# `npm run phone` reinstalls it.
set -euo pipefail
cd "$(dirname "$0")"

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK" ]; then
  echo "Set ANDROID_HOME to your Android SDK folder." >&2
  exit 1
fi
BUILD_TOOLS="$SDK/build-tools/34.0.0"
ANDROID_JAR="$SDK/platforms/android-34/android.jar"
OUT=build

rm -rf "$OUT"
mkdir -p "$OUT/classes" "$OUT/gen"

# Resources + manifest -> unsigned APK (and R.java)
"$BUILD_TOOLS/aapt2" compile --dir res -o "$OUT/res.zip"
"$BUILD_TOOLS/aapt2" link -o "$OUT/app.apk" -I "$ANDROID_JAR" \
  --manifest AndroidManifest.xml --java "$OUT/gen" "$OUT/res.zip"

# Java -> .class -> classes.dex, added to the APK
javac --release 11 -classpath "$ANDROID_JAR" -d "$OUT/classes" \
  $(find src "$OUT/gen" -name '*.java')
"$BUILD_TOOLS/d8" --min-api 26 --lib "$ANDROID_JAR" --output "$OUT" \
  $(find "$OUT/classes" -name '*.class')
(cd "$OUT" && zip -q app.apk classes.dex)

# Align and sign. The debug key is created once and kept out of git.
"$BUILD_TOOLS/zipalign" -f 4 "$OUT/app.apk" "$OUT/aligned.apk"
if [ ! -f debug.keystore ]; then
  keytool -genkeypair -keystore debug.keystore -storepass android -keypass android \
    -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"
fi
"$BUILD_TOOLS/apksigner" sign --ks debug.keystore --ks-pass pass:android \
  --out cafe.apk "$OUT/aligned.apk"
rm -f cafe.apk.idsig

echo "Built $(pwd)/cafe.apk"
