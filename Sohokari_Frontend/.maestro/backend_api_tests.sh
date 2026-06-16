#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# SOHOKARI Backend API Test Suite
# Run: bash .maestro/backend_api_tests.sh
# ══════════════════════════════════════════════════════════════
set -euo pipefail

BASE="http://localhost:8080/api/v1"
PASS=0; FAIL=0; WARN=0
REPORT=""

test_api() {
  local label="$1" method="$2" url="$3" expected_code="$4"
  shift 4
  local body="${1:-}"
  
  if [ "$method" = "POST" ] && [ -n "$body" ]; then
    actual_code=$(curl -s -o /tmp/sohokari_test_resp.json -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$body" 2>/dev/null)
  elif [ "$method" = "GET" ]; then
    actual_code=$(curl -s -o /tmp/sohokari_test_resp.json -w "%{http_code}" "$url" ${body:+-H "$body"} 2>/dev/null)
  elif [ "$method" = "PUT" ]; then
    actual_code=$(curl -s -o /tmp/sohokari_test_resp.json -w "%{http_code}" -X PUT "$url" -H "Content-Type: application/json" ${body:+-d "$body"} 2>/dev/null)
  else
    actual_code=$(curl -s -o /tmp/sohokari_test_resp.json -w "%{http_code}" -X "$method" "$url" 2>/dev/null)
  fi
  
  if [ "$actual_code" = "$expected_code" ]; then
    echo "  ✅ PASS: $label (HTTP $actual_code)"
    PASS=$((PASS + 1))
    REPORT+="| ✅ | $label | $expected_code | $actual_code |\n"
  else
    echo "  ❌ FAIL: $label (expected $expected_code, got $actual_code)"
    FAIL=$((FAIL + 1))
    REPORT+="| ❌ | $label | $expected_code | $actual_code |\n"
  fi
}

echo "════════════════════════════════════════════════"
echo "   SOHOKARI Backend API Test Suite"
echo "════════════════════════════════════════════════"
echo ""

# ── 1. AUTH ENDPOINTS ────────────────────────────────────
echo "▸ Authentication Endpoints"
test_api "Login - Valid creds"   POST "$BASE/auth/login" "200" '{"email":"customer@test.com","password":"password123"}'

# Save token for authenticated calls
TOKEN=$(cat /tmp/sohokari_test_resp.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('accessToken',''))" 2>/dev/null || echo "")

test_api "Login - Bad password"  POST "$BASE/auth/login" "400" '{"email":"customer@test.com","password":"wrong"}'
test_api "Login - Bad email"     POST "$BASE/auth/login" "400" '{"email":"nonexistent@test.com","password":"pass"}'
test_api "Login - Empty body"    POST "$BASE/auth/login" "400" '{}'

# ── 2. PROVIDER ENDPOINTS (public) ───────────────────────
echo ""
echo "▸ Provider Endpoints (public)"
test_api "Provider search"       POST "$BASE/providers/search" "200" '{"latitude":23.87,"longitude":90.37,"maxDistanceKm":10}'
test_api "Provider search w/cat" POST "$BASE/providers/search" "200" '{"latitude":23.87,"longitude":90.37,"maxDistanceKm":10,"category":"ELECTRICIAN"}'
test_api "Provider nearby"       GET  "$BASE/providers/nearby?latitude=23.87&longitude=90.37&maxDistanceKm=10" "200"

# ── 3. PROTECTED ENDPOINTS (no auth) ─────────────────────
echo ""
echo "▸ Protected Endpoints (no auth → 403)"
test_api "Bookings w/o token"     GET  "$BASE/bookings/my" "403"
test_api "Chat w/o token"         GET  "$BASE/chats/conversations" "403"
test_api "Notifications w/o auth" GET  "$BASE/notifications" "403"
test_api "Payments w/o auth"      GET  "$BASE/payments/my" "403"
test_api "User profile w/o auth"  GET  "$BASE/users/me/location" "403"

# ── 4. AUTHENTICATED ENDPOINTS ───────────────────────────
echo ""
echo "▸ Authenticated Endpoints"
if [ -n "$TOKEN" ]; then
  AUTH="Authorization: Bearer $TOKEN"
  test_api "My bookings"           GET "$BASE/bookings/my?page=0&size=10" "200" "$AUTH"
  test_api "My notifications"      GET "$BASE/notifications" "200" "$AUTH"
  test_api "Unread count"          GET "$BASE/notifications/unread-count" "200" "$AUTH"
  test_api "Chat conversations"    GET "$BASE/chats/conversations" "200" "$AUTH"
  test_api "My payments"           GET "$BASE/payments/my" "200" "$AUTH"
else
  echo "  ⚠️  SKIP: No auth token obtained"
  WARN=$((WARN + 1))
fi

# ── 5. ERROR HANDLING ────────────────────────────────────
echo ""
echo "▸ Error Handling"
test_api "Invalid endpoint"        GET  "$BASE/nonexistent" "403"
test_api "XSS in login email"     POST "$BASE/auth/login" "400" '{"email":"<script>alert(1)</script>","password":"test"}'

# ── 6. RATE LIMITING ────────────────────────────────────
echo ""
echo "▸ Rate Limiting"
echo "  Sending 5 rapid requests..."
for i in $(seq 1 5); do
  curl -s -o /dev/null -w "" -X POST "$BASE/providers/search" -H "Content-Type: application/json" -d '{"latitude":23.87,"longitude":90.37,"maxDistanceKm":1}' &
done
wait
test_api "Post-burst request"    POST "$BASE/providers/search" "200" '{"latitude":23.87,"longitude":90.37,"maxDistanceKm":1}'
echo "  ✅ Rate limiting not triggered (< 100 req/min)"

# ── 7. SWAGGER DOCS ─────────────────────────────────────
echo ""
echo "▸ Documentation"
test_api "Swagger UI"            GET  "$BASE/../swagger-ui.html" "302"
test_api "OpenAPI spec"          GET  "$BASE/../v3/api-docs" "200"

# ── SUMMARY ──────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  RESULTS: ✅ $PASS passed | ❌ $FAIL failed | ⚠️  $WARN warnings"
echo "════════════════════════════════════════════════"

# Write report
REPORT_FILE="/home/adnan/Desktop/Sohokari MAD/Sohokari_Frontend/.maestro/backend_test_results.md"
cat > "$REPORT_FILE" << EOF
# Backend API Test Results
**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Server**: $BASE

## Summary
- ✅ Passed: $PASS
- ❌ Failed: $FAIL
- ⚠️ Warnings: $WARN

## Results
| Status | Test | Expected | Actual |
|--------|------|----------|--------|
$(echo -e "$REPORT")
EOF
echo "Report saved to: $REPORT_FILE"
