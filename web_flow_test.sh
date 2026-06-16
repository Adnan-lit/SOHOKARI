#!/bin/bash
# ============================================================
# SOHOKARI — Web Flow Screenshot Testing
# ============================================================
# Uses headless Chrome to capture screenshots of each screen

BASE_URL="http://localhost:8081"
SCREENSHOT_DIR="/tmp/sohokari_web_tests"
mkdir -p "$SCREENSHOT_DIR"

screenshot() {
  local name=$1
  local url=$2
  local wait=${3:-5000}
  echo "📸 Capturing: $name"
  google-chrome --headless --screenshot="$SCREENSHOT_DIR/${name}.png" \
    --window-size=400,800 --disable-gpu --virtual-time-budget=$wait \
    "$url" 2>/dev/null
  if [[ -f "$SCREENSHOT_DIR/${name}.png" ]]; then
    echo "   ✅ Saved: $SCREENSHOT_DIR/${name}.png"
  else
    echo "   ❌ Failed to capture"
  fi
}

echo "╔══════════════════════════════════════════════════════╗"
echo "║   SOHOKARI Web Flow Screenshot Test Suite           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 1. Splash Screen (quick capture)
screenshot "01_splash_screen" "$BASE_URL" 2000

# 2. Login Screen (after splash)
screenshot "02_login_screen" "$BASE_URL" 10000

# 3. Registration pages are accessed via navigation, but we can test initial load

echo ""
echo "=== Screenshots saved to: $SCREENSHOT_DIR ==="
ls -la "$SCREENSHOT_DIR"/*.png 2>/dev/null
echo ""
echo "Note: Web version requires user interaction for navigation."
echo "Full flow testing requires Playwright/Puppeteer for form filling."
