#!/usr/bin/env bash
# ============================================================================
# build-apk.sh — signed Android APK for Café Bazaar (کافه بازار)
#
# Produces: download/color-manor-<version>.apk
#
# What it does:
#   1. builds the game as a Next.js STATIC EXPORT (API routes moved aside,
#      trailingSlash on) with NEXT_PUBLIC_API_BASE baked into the client,
#   2. compiles the tiny WebView shell (android/), generates launcher
#      icons from upload/color_manor_app_icon_1024.png,
#   3. packages assets/www + classes.dex into the APK,
#   4. zipaligns and signs it (keystore auto-created on first run).
#
# Toolchain is downloaded once into .sdk-cache/ (build-tools 34, platform-34,
# ECJ java compiler) — no Android Studio / Gradle needed.
#
# NOTE: stop any running dev server first (it shares the .next directory):
#         pkill -f "next dev"
# Rebuild with a different API base:
#         API_BASE=https://<your-app>.vercel.app bash scripts/build-apk.sh
# ============================================================================
set -euo pipefail

API_BASE="${API_BASE:-https://colormonor.vercel.app}"
VER_NAME="1.1.4"
VER_CODE="6"
KS="keys/color-manor-release.keystore"
KS_ALIAS="colormanor"
KS_PASS="${KS_PASS:-Manor1404Apk!}"

cd "$(dirname "$0")/.."
mkdir -p build/apk keys .sdk-cache android/assets/www

# ---------------------------------------------------------------- 0 toolchain
SDK=.sdk-cache
BT="$SDK/build-tools"; AJ="$SDK/android.jar"; ECJ="$SDK/ecj-3.33.0.jar"
BT_URL="https://dl.google.com/android/repository/build-tools_r34-linux.zip"
PLAT_URL="https://dl.google.com/android/repository/platform-34-ext7_r03.zip"
ECJ_URL="https://maven.aliyun.com/repository/public/org/eclipse/jdt/ecj/3.33.0/ecj-3.33.0.jar"

if [ ! -f "$BT/aapt2" ]; then
  echo "→ downloading build-tools 34"
  curl -sS -o "$SDK/bt.zip" "$BT_URL"
  unzip -qo "$SDK/bt.zip" -d "$SDK/bt-extract"
  rm -rf "$BT"; mkdir -p "$BT"
  cp -r "$SDK"/bt-extract/android-*/. "$BT/"
  chmod +x "$BT/aapt2" "$BT/zipalign" "$BT/apksigner" 2>/dev/null || true
fi
if [ ! -f "$AJ" ]; then
  echo "→ downloading platform android-34"
  curl -sS -o "$SDK/plat.zip" "$PLAT_URL"
  unzip -qo "$SDK/plat.zip" -d "$SDK/plat-extract"
  cp "$SDK"/plat-extract/android-*/android.jar "$AJ"
fi
if [ ! -f "$ECJ" ]; then
  echo "→ downloading ECJ java compiler"
  curl -sS -o "$ECJ" "$ECJ_URL"
fi
echo "✓ toolchain ready"

# ---- tripwire: MainActivity must prefix AssetManager lookups with "www/".
# AssetManager resolves relative to assets/; the game lives in assets/www/.
# v1.1.0 forgot the prefix → every request fell to the network →
# "Web page not available" (ERR_NAME_NOT_RESOLVED).
grep -q 'ASSET_ROOT' android/java/com/milad1711/colormanor/MainActivity.java \
  || { echo "✗✗✗ MainActivity lost the ASSET_ROOT (www/) prefix — main frame would fall to network"; exit 1; }

# ---------------------------------------------------------------- 1 icons
echo "→ generating launcher icons"
python3 scripts/make-icons.py > /dev/null

# ---------------------------------------------------------------- 2 export
echo "→ building static export (API_BASE=$API_BASE)"
rm -rf out build/apk/classes build/apk/dex
mkdir -p build/apk/classes build/apk/dex

mv src/app/api .api-aside
mv src/middleware.ts .middleware-aside
restore() {
  [ -d .api-aside ] && mv .api-aside src/app/api
  [ -f .middleware-aside ] && mv .middleware-aside src/middleware.ts
  return 0
}
trap restore EXIT

APK_EXPORT=1 NEXT_PUBLIC_API_BASE="$API_BASE" npx next build
restore; trap - EXIT

test -f out/index.html || { echo "✗ export failed: out/index.html missing"; exit 1; }
test -f out/admin/index.html || { echo "✗ export failed: out/admin/index.html missing"; exit 1; }

rm -rf android/assets/www
mkdir -p android/assets/www
cp -r out/. android/assets/www/
echo "✓ assets/www ready ($(du -sh android/assets/www | cut -f1))"

# ---------------------------------------------------------------- 3 resources
BTBIN="$BT/aapt2"
echo "→ compiling resources"
"$BTBIN" compile --dir android/res -o build/apk/res.zip
"$BTBIN" link -o build/apk/base.apk \
  -I "$AJ" \
  --manifest android/AndroidManifest.xml \
  -R build/apk/res.zip \
  --auto-add-overlay \
  --min-sdk-version 21 --target-sdk-version 34

# ---------------------------------------------------------------- 4 aidl+java→dex
echo "→ compiling AIDL → java → dex"
AIDLGEN=build/apk/aidlgen
rm -rf "$AIDLGEN" build/apk/classes build/apk/dex
mkdir -p "$AIDLGEN" build/apk/classes build/apk/dex
"$BT/aidl" -Iandroid/aidl -o "$AIDLGEN" \
  android/aidl/com/android/vending/billing/IInAppBillingService.aidl
test -f "$AIDLGEN/com/android/vending/billing/IInAppBillingService.java" \
  || { echo "✗ aidl failed"; exit 1; }
java -jar "$ECJ" -nowarn -source 8 -target 8 -encoding UTF-8 \
  -cp "$AJ" -d build/apk/classes \
  android/java/com/milad1711/colormanor/MainActivity.java \
  "$AIDLGEN/com/android/vending/billing/IInAppBillingService.java"
java -cp "$BT/lib/d8.jar" com.android.tools.r8.D8 \
  --release --lib "$AJ" --min-api 21 \
  --output build/apk/dex \
  $(find build/apk/classes -name '*.class')
test -f build/apk/dex/classes.dex || { echo "✗ dex failed"; exit 1; }

# ---------------------------------------------------------------- 5 package
echo "→ packaging APK"
test -f android/assets/www/index.html || { echo "✗ assets/www missing"; exit 1; }
cp build/apk/base.apk build/apk/unsigned.apk
# CRITICAL: zip from android/ so entries land under assets/… — AssetManager
# only sees files inside the APK's assets/ directory (v1.0.0 shipped them at
# the APK root → webview fell back to the network → ERR_NAME_NOT_RESOLVED).
( cd android && zip -rqX ../build/apk/unsigned.apk assets )
( cd build/apk/dex && zip -qX ../unsigned.apk classes.dex )

# ---------------------------------------------------------------- 6 align+sign
echo "→ zipalign + sign"
"$BT/zipalign" -f 4 build/apk/unsigned.apk build/apk/aligned.apk

if [ ! -f "$KS" ]; then
  echo "→ generating release keystore (first run)"
  keytool -genkeypair -v \
    -keystore "$KS" -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=Color Manor, OU=Games, O=Milad, L=Tehran, C=IR"
fi

OUT="download/color-manor-$VER_NAME.apk"
"$BT/apksigner" sign \
  --ks "$KS" --ks-key-alias "$KS_ALIAS" \
  --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
  --out "$OUT" build/apk/aligned.apk
"$BT/apksigner" verify --print-certs "$OUT" | head -5

# ---- self-check 1: assets really inside the APK
if ! unzip -l "$OUT" | grep -q "assets/www/index.html"; then
  echo "✗✗✗ assets/www/index.html missing from APK — packaging bug"; exit 1
fi
echo "✓ assets/www present in APK ($(unzip -l "$OUT" | grep -c 'assets/www/') files)"

# ---- self-check 2: dex carries the www/ lookup prefix + offline fallback
unzip -p "$OUT" classes.dex > build/apk/dex-check.dex
if ! grep -qa 'www/index.html' build/apk/dex-check.dex \
   || ! grep -qa 'file:///android_asset/' build/apk/dex-check.dex; then
  echo "✗✗✗ classes.dex lacks www/ asset prefix or offline fallback"; exit 1
fi
echo "✓ dex carries www/ prefix + file:// fallback"

# ---- self-check 3: every asset referenced by the HTML pages exists in the APK
python3 - "$OUT" <<'PYEOF'
import re, sys, zipfile
apk = sys.argv[1]
z = zipfile.ZipFile(apk)
names = set(z.namelist())
missing = []
for page in ("assets/www/index.html", "assets/www/admin/index.html"):
    html = z.read(page).decode("utf-8", "ignore")
    for ref in re.findall(r'(?:src|href)="([^"]+)"', html):
        p = ref.split("?")[0].split("#")[0]
        if p.startswith("/") and len(p) > 1 and ("assets/www" + p) not in names:
            missing.append((page, p))
if missing:
    print("MISSING REFS:", missing)
    sys.exit(1)
print("✓ all HTML-referenced assets resolve inside the APK")
PYEOF

echo ""
echo "✓✓✓ APK ready: $OUT ($(du -h "$OUT" | cut -f1))"
echo "   package: com.milad1711.colormanor  v$VER_NAME (code $VER_CODE)"
