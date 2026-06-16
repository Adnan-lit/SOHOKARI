#!/bin/bash
# ============================================================
# SOHOKARI — Comprehensive Backend API Test Suite
# ============================================================
set -uo pipefail
CUST_TOKEN=""; PROV_TOKEN=""; CUST_ID=""; PROV_ID=""; BOOKING_ID=""; PAYMENT_ID=""; CUST_REFRESH=""
BASE="http://localhost:8080/api/v1"
PASS=0; FAIL=0; WARN=0; RESULTS=""

log_pass() { PASS=$((PASS+1)); RESULTS+="✅ PASS: $1\n"; echo "✅ PASS: $1"; }
log_fail() { FAIL=$((FAIL+1)); RESULTS+="❌ FAIL: $1 — $2\n"; echo "❌ FAIL: $1 — $2"; }
log_warn() { WARN=$((WARN+1)); RESULTS+="⚠️  WARN: $1 — $2\n"; echo "⚠️  WARN: $1 — $2"; }

# Helper: make request, capture status + body
req() {
  local method=$1 url=$2; shift 2
  local body=""
  [[ "$#" -gt 0 ]] && body="$1"
  if [[ -z "$body" ]]; then
    RESP=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      ${AUTH_HEADER:+-H "$AUTH_HEADER"} 2>&1)
  else
    RESP=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
      -d "$body" 2>&1)
  fi
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
}

echo "╔══════════════════════════════════════════════════════╗"
echo "║   SOHOKARI API Test Suite — $(date '+%Y-%m-%d %H:%M')    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# 1. AUTHENTICATION TESTS
# ============================================================
echo "━━━ 1. AUTHENTICATION ━━━"

# 1.1 Register customer
AUTH_HEADER=""
req POST "$BASE/auth/register/customer" '{"name":"QA Customer","email":"qa_cust_1781627214@test.com","password":"Test@123","phone":"01811111111"}'
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "1.1 Register customer (HTTP $HTTP_CODE)"
  CUST_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "")
  CUST_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['userId'])" 2>/dev/null || echo "")
elif echo "$BODY" | grep -qi "already exists\|duplicate"; then
  log_warn "1.1 Register customer" "Already exists (HTTP $HTTP_CODE)"
else
  log_fail "1.1 Register customer" "HTTP $HTTP_CODE: $BODY"
fi

# 1.2 Register provider
req POST "$BASE/auth/register/provider" '{"name":"QA Provider","email":"qa_prov_1781627214@test.com","password":"Test@123","phone":"01822222222","serviceCategory":"ELECTRICIAN","nid":"9876543210123","tradeLicense":"TL-2026-001","latitude":23.8103,"longitude":90.4125}'
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "1.2 Register provider (HTTP $HTTP_CODE)"
  PROV_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "")
  PROV_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['userId'])" 2>/dev/null || echo "")
elif echo "$BODY" | grep -qi "already exists\|duplicate"; then
  log_warn "1.2 Register provider" "Already exists (HTTP $HTTP_CODE)"
else
  log_fail "1.2 Register provider" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
fi

# 1.3 Login customer
req POST "$BASE/auth/login" '{"email":"qa_cust_1781627214@test.com","password":"Test@123"}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "1.3 Login customer (HTTP $HTTP_CODE)"
  CUST_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "$CUST_TOKEN")
  CUST_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['userId'])" 2>/dev/null || echo "$CUST_ID")
  CUST_REFRESH=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null || echo "")
else
  log_fail "1.3 Login customer" "HTTP $HTTP_CODE: $BODY"
fi

# 1.4 Login provider
req POST "$BASE/auth/login" '{"email":"qa_prov_1781627214@test.com","password":"Test@123"}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "1.4 Login provider (HTTP $HTTP_CODE)"
  PROV_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "$PROV_TOKEN")
  PROV_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['userId'])" 2>/dev/null || echo "$PROV_ID")
else
  log_fail "1.4 Login provider" "HTTP $HTTP_CODE: $BODY"
fi

# 1.5 Wrong credentials
req POST "$BASE/auth/login" '{"email":"qa_cust_1781627214@test.com","password":"WrongPass"}'
if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "400" || "$HTTP_CODE" == "403" ]]; then
  log_pass "1.5 Wrong credentials rejected (HTTP $HTTP_CODE)"
else
  log_fail "1.5 Wrong credentials" "Expected 4xx, got HTTP $HTTP_CODE"
fi

# 1.6 Empty body
req POST "$BASE/auth/login" '{}'
if [[ "$HTTP_CODE" =~ ^4 ]]; then
  log_pass "1.6 Empty login body rejected (HTTP $HTTP_CODE)"
else
  log_fail "1.6 Empty login body" "Expected 4xx, got HTTP $HTTP_CODE"
fi

# 1.7 Refresh token
if [[ -n "${CUST_REFRESH:-}" ]]; then
  req POST "$BASE/auth/refresh-token" "{\"refreshToken\":\"$CUST_REFRESH\"}"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "1.7 Refresh token (HTTP $HTTP_CODE)"
    CUST_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "$CUST_TOKEN")
  else
    log_fail "1.7 Refresh token" "HTTP $HTTP_CODE"
  fi
fi

# 1.8 Protected endpoint without token
AUTH_HEADER=""
req GET "$BASE/bookings/my"
if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" ]]; then
  log_pass "1.8 Protected endpoint without token (HTTP $HTTP_CODE)"
else
  log_fail "1.8 Protected endpoint without token" "Expected 401/403, got HTTP $HTTP_CODE"
fi

echo ""

# ============================================================
# 2. USER / PROFILE TESTS (Customer)
# ============================================================
echo "━━━ 2. USER PROFILE (Customer) ━━━"
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

# 2.1 Update profile
req PUT "$BASE/users/me/profile" '{"name":"QA Customer Updated","phone":"01899999999"}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "2.1 Update customer profile (HTTP $HTTP_CODE)"
else
  log_fail "2.1 Update customer profile" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
fi

# 2.2 Update location
req PUT "$BASE/users/me/location" '{"latitude":23.8103,"longitude":90.4125}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "2.2 Update location (HTTP $HTTP_CODE)"
else
  log_fail "2.2 Update location" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
fi

# 2.3 Get location
req GET "$BASE/users/me/location"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "2.3 Get location (HTTP $HTTP_CODE)"
else
  log_fail "2.3 Get location" "HTTP $HTTP_CODE"
fi

echo ""

# ============================================================
# 3. PROVIDER PROFILE TESTS
# ============================================================
echo "━━━ 3. PROVIDER PROFILE ━━━"
AUTH_HEADER="Authorization: Bearer $PROV_TOKEN"

# 3.1 Get my provider profile
req GET "$BASE/providers/me"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "3.1 Get provider profile (HTTP $HTTP_CODE)"
else
  log_fail "3.1 Get provider profile" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
fi

# 3.2 Update provider profile
req PUT "$BASE/providers/me/profile" '{"bio":"Experienced electrician","hourlyRate":600}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "3.2 Update provider profile (HTTP $HTTP_CODE)"
else
  log_fail "3.2 Update provider profile" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
fi

# 3.3 Toggle availability
req PUT "$BASE/providers/me/availability"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "3.3 Toggle availability (HTTP $HTTP_CODE)"
else
  log_fail "3.3 Toggle availability" "HTTP $HTTP_CODE"
fi

# 3.4 Get public provider profile
req GET "$BASE/providers/${PROV_ID:-unknown}"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "3.4 Get public provider profile (HTTP $HTTP_CODE)"
else
  log_fail "3.4 Get public provider profile" "HTTP $HTTP_CODE"
fi

echo ""

# ============================================================
# 4. SEARCH & DISCOVERY
# ============================================================
echo "━━━ 4. SEARCH & DISCOVERY ━━━"
AUTH_HEADER=""

# 4.1 Search services (public)
req GET "$BASE/services/search?query=electrician"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "4.1 Search services (HTTP $HTTP_CODE)"
else
  log_fail "4.1 Search services" "HTTP $HTTP_CODE"
fi

# 4.2 Nearby providers (public)
req GET "$BASE/providers/nearby?latitude=23.8103&longitude=90.4125&radiusKm=10"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "4.2 Nearby providers (HTTP $HTTP_CODE)"
else
  log_fail "4.2 Nearby providers" "HTTP $HTTP_CODE"
fi

# 4.3 Search providers (public)
req POST "$BASE/providers/search" '{"category":"ELECTRICIAN","latitude":23.8103,"longitude":90.4125}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "4.3 Search providers (HTTP $HTTP_CODE)"
else
  log_fail "4.3 Search providers" "HTTP $HTTP_CODE"
fi

# 4.4 Recommendations (auth)
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"
req GET "$BASE/recommendations"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "4.4 Recommendations (HTTP $HTTP_CODE)"
else
  log_warn "4.4 Recommendations" "HTTP $HTTP_CODE (may need data)"
fi

echo ""

# ============================================================
# 5. BOOKING FLOW
# ============================================================
echo "━━━ 5. BOOKING FLOW ━━━"
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

# 5.1 Create booking
req POST "$BASE/bookings" "{\"providerId\":\"$PROV_ID\",\"serviceCategory\":\"ELECTRICIAN\",\"scheduledDate\":\"2026-06-20T10:00:00\",\"description\":\"Fix kitchen wiring\",\"address\":\"123 Test Road, Dhaka\"}"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  log_pass "5.1 Create booking (HTTP $HTTP_CODE)"
  BOOKING_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',d.get('data',{}).get('bookingId','')))" 2>/dev/null || echo "")
else
  log_fail "5.1 Create booking" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
  BOOKING_ID=""
fi

# 5.2 Get my bookings (customer)
req GET "$BASE/bookings/my"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "5.2 Get my bookings - customer (HTTP $HTTP_CODE)"
  # Try to get booking ID from list if we didn't get it from create
  if [[ -z "$BOOKING_ID" ]]; then
    BOOKING_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); lst=d.get('data',[]); print(lst[0]['id'] if lst else '')" 2>/dev/null || echo "")
  fi
else
  log_fail "5.2 Get my bookings - customer" "HTTP $HTTP_CODE"
fi

# 5.3 Get my bookings (provider)
AUTH_HEADER="Authorization: Bearer $PROV_TOKEN"
req GET "$BASE/bookings/my"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "5.3 Get my bookings - provider (HTTP $HTTP_CODE)"
  if [[ -z "$BOOKING_ID" ]]; then
    BOOKING_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); lst=d.get('data',[]); print(lst[0]['id'] if lst else '')" 2>/dev/null || echo "")
  fi
else
  log_fail "5.3 Get my bookings - provider" "HTTP $HTTP_CODE"
fi

if [[ -n "$BOOKING_ID" ]]; then
  # 5.4 Get single booking
  AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"
  req GET "$BASE/bookings/$BOOKING_ID"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "5.4 Get booking details (HTTP $HTTP_CODE)"
  else
    log_fail "5.4 Get booking details" "HTTP $HTTP_CODE"
  fi

  # 5.5 Provider accepts booking
  AUTH_HEADER="Authorization: Bearer $PROV_TOKEN"
  req PUT "$BASE/bookings/$BOOKING_ID/accept"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "5.5 Provider accepts booking (HTTP $HTTP_CODE)"
  else
    log_fail "5.5 Provider accepts booking" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
  fi

  # 5.6 Provider starts booking
  req PUT "$BASE/bookings/$BOOKING_ID/start"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "5.6 Provider starts booking (HTTP $HTTP_CODE)"
  else
    log_fail "5.6 Provider starts booking" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
  fi

  # 5.7 Provider completes booking
  req PUT "$BASE/bookings/$BOOKING_ID/complete"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "5.7 Provider completes booking (HTTP $HTTP_CODE)"
  else
    log_fail "5.7 Provider completes booking" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
  fi
else
  log_fail "5.4-5.7 Booking lifecycle" "No BOOKING_ID available"
fi

echo ""

# ============================================================
# 6. PAYMENT FLOW
# ============================================================
echo "━━━ 6. PAYMENT FLOW ━━━"
if [[ -n "$BOOKING_ID" ]]; then
  AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

  # 6.1 Create payment
  req POST "$BASE/payments" "{\"bookingId\":\"$BOOKING_ID\",\"amount\":600,\"method\":\"BKASH\",\"providerPaymentNumber\":\"01822222222\"}"
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    log_pass "6.1 Create payment (HTTP $HTTP_CODE)"
    PAYMENT_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',d.get('data',{}).get('paymentId','')))" 2>/dev/null || echo "")
  else
    log_fail "6.1 Create payment" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
    PAYMENT_ID=""
  fi

  # 6.2 Get payments for booking
  req GET "$BASE/payments/booking/$BOOKING_ID"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "6.2 Get payment by booking (HTTP $HTTP_CODE)"
    if [[ -z "$PAYMENT_ID" ]]; then
      PAYMENT_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null || echo "")
    fi
  else
    log_fail "6.2 Get payment by booking" "HTTP $HTTP_CODE"
  fi

  # 6.3 Get my payments
  req GET "$BASE/payments/my"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "6.3 Get my payments (HTTP $HTTP_CODE)"
  else
    log_fail "6.3 Get my payments" "HTTP $HTTP_CODE"
  fi

  if [[ -n "$PAYMENT_ID" ]]; then
    # 6.4 Provider confirms payment
    AUTH_HEADER="Authorization: Bearer $PROV_TOKEN"
    req PUT "$BASE/payments/$PAYMENT_ID/confirm"
    if [[ "$HTTP_CODE" == "200" ]]; then
      log_pass "6.4 Provider confirms payment (HTTP $HTTP_CODE)"
    else
      log_fail "6.4 Provider confirms payment" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
    fi

    # 6.5 Get invoice
    req GET "$BASE/payments/$PAYMENT_ID/invoice"
    if [[ "$HTTP_CODE" == "200" ]]; then
      log_pass "6.5 Get invoice (HTTP $HTTP_CODE)"
    else
      log_fail "6.5 Get invoice" "HTTP $HTTP_CODE"
    fi
  fi

  # 6.6 Provider earnings
  req GET "$BASE/providers/me/earnings"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "6.6 Provider earnings (HTTP $HTTP_CODE)"
  else
    log_fail "6.6 Provider earnings" "HTTP $HTTP_CODE"
  fi
else
  log_fail "6.x Payment flow" "No BOOKING_ID — skipped"
fi

echo ""

# ============================================================
# 7. REVIEW FLOW
# ============================================================
echo "━━━ 7. REVIEWS ━━━"
if [[ -n "$BOOKING_ID" ]]; then
  AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

  # 7.1 Submit review
  req POST "$BASE/reviews" "{\"bookingId\":\"$BOOKING_ID\",\"providerId\":\"$PROV_ID\",\"rating\":5,\"comment\":\"Excellent service!\"}"
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    log_pass "7.1 Submit review (HTTP $HTTP_CODE)"
    REVIEW_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null || echo "")
  else
    log_fail "7.1 Submit review" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
  fi

  # 7.2 Check review exists
  req GET "$BASE/reviews/booking/$BOOKING_ID/exists"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "7.2 Check review exists (HTTP $HTTP_CODE)"
  else
    log_fail "7.2 Check review exists" "HTTP $HTTP_CODE"
  fi

  # 7.3 Get provider reviews (public)
  AUTH_HEADER=""
  req GET "$BASE/reviews/provider/$PROV_ID"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "7.3 Get provider reviews (HTTP $HTTP_CODE)"
  else
    log_fail "7.3 Get provider reviews" "HTTP $HTTP_CODE"
  fi
else
  log_fail "7.x Review flow" "No BOOKING_ID — skipped"
fi

echo ""

# ============================================================
# 8. CHAT FLOW
# ============================================================
echo "━━━ 8. CHAT ━━━"
if [[ -n "$BOOKING_ID" ]]; then
  AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

  # 8.1 Send message
  req POST "$BASE/chats/send" "{\"bookingId\":\"$BOOKING_ID\",\"content\":\"Hello, when can you come?\"}"
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    log_pass "8.1 Send chat message (HTTP $HTTP_CODE)"
    MSG_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null || echo "")
  else
    log_fail "8.1 Send chat message" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
  fi

  # 8.2 Get chat history
  req GET "$BASE/chats/$BOOKING_ID/messages"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "8.2 Get chat history (HTTP $HTTP_CODE)"
  else
    log_fail "8.2 Get chat history" "HTTP $HTTP_CODE"
  fi

  # 8.3 Get conversations
  req GET "$BASE/chats/conversations"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "8.3 Get conversations (HTTP $HTTP_CODE)"
  else
    log_fail "8.3 Get conversations" "HTTP $HTTP_CODE"
  fi

  # 8.4 Mark as read
  req PUT "$BASE/chats/$BOOKING_ID/read"
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "8.4 Mark messages read (HTTP $HTTP_CODE)"
  else
    log_fail "8.4 Mark messages read" "HTTP $HTTP_CODE"
  fi

  # 8.5 Provider replies
  AUTH_HEADER="Authorization: Bearer $PROV_TOKEN"
  req POST "$BASE/chats/send" "{\"bookingId\":\"$BOOKING_ID\",\"content\":\"I can come at 10 AM tomorrow.\"}"
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    log_pass "8.5 Provider sends reply (HTTP $HTTP_CODE)"
  else
    log_fail "8.5 Provider sends reply" "HTTP $HTTP_CODE"
  fi
else
  log_fail "8.x Chat flow" "No BOOKING_ID — skipped"
fi

echo ""

# ============================================================
# 9. NOTIFICATIONS
# ============================================================
echo "━━━ 9. NOTIFICATIONS ━━━"
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

# 9.1 Get notifications
req GET "$BASE/notifications"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "9.1 Get notifications (HTTP $HTTP_CODE)"
else
  log_fail "9.1 Get notifications" "HTTP $HTTP_CODE"
fi

# 9.2 Unread count
req GET "$BASE/notifications/unread-count"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "9.2 Unread count (HTTP $HTTP_CODE)"
else
  log_fail "9.2 Unread count" "HTTP $HTTP_CODE"
fi

# 9.3 Mark all read
req PUT "$BASE/notifications/read-all"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "9.3 Mark all notifications read (HTTP $HTTP_CODE)"
else
  log_fail "9.3 Mark all notifications read" "HTTP $HTTP_CODE"
fi

# 9.4 Register FCM token
req POST "$BASE/notifications/fcm-token" '{"token":"test-fcm-token-12345"}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "9.4 Register FCM token (HTTP $HTTP_CODE)"
else
  log_fail "9.4 Register FCM token" "HTTP $HTTP_CODE: $(echo $BODY | head -c 200)"
fi

echo ""

# ============================================================
# 10. REPUTATION & SCHEDULING
# ============================================================
echo "━━━ 10. REPUTATION & SCHEDULING ━━━"
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

# 10.1 Get provider reputation
req GET "$BASE/providers/$PROV_ID/reputation"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "10.1 Get provider reputation (HTTP $HTTP_CODE)"
else
  log_fail "10.1 Get provider reputation" "HTTP $HTTP_CODE"
fi

# 10.2 Scheduling suggestions
req GET "$BASE/scheduling/suggest/$PROV_ID"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "10.2 Scheduling suggestions (HTTP $HTTP_CODE)"
else
  log_fail "10.2 Scheduling suggestions" "HTTP $HTTP_CODE"
fi

# 10.3 Activity summary
req GET "$BASE/activity/summary"
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "10.3 Activity summary (HTTP $HTTP_CODE)"
else
  log_fail "10.3 Activity summary" "HTTP $HTTP_CODE"
fi

echo ""

# ============================================================
# 11. AI CHAT
# ============================================================
echo "━━━ 11. AI CHAT ━━━"
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

req POST "$BASE/ai/chat" '{"message":"What services do you offer?"}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "11.1 AI chat (HTTP $HTTP_CODE)"
else
  log_warn "11.1 AI chat" "HTTP $HTTP_CODE (may need OpenRouter API key)"
fi

echo ""

# ============================================================
# 12. SMART MATCHING
# ============================================================
echo "━━━ 12. SMART MATCHING ━━━"
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"

req POST "$BASE/matching/find" '{"serviceCategory":"ELECTRICIAN","latitude":23.8103,"longitude":90.4125,"description":"Need electrical repair"}'
if [[ "$HTTP_CODE" == "200" ]]; then
  log_pass "12.1 Smart matching (HTTP $HTTP_CODE)"
else
  log_warn "12.1 Smart matching" "HTTP $HTTP_CODE"
fi

echo ""

# ============================================================
# 13. EDGE CASES & SECURITY
# ============================================================
echo "━━━ 13. EDGE CASES & SECURITY ━━━"

# 13.1 Invalid booking ID
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"
req GET "$BASE/bookings/000000000000000000000000"
if [[ "$HTTP_CODE" =~ ^4 ]]; then
  log_pass "13.1 Invalid booking ID handled (HTTP $HTTP_CODE)"
else
  log_fail "13.1 Invalid booking ID" "Expected 4xx, got HTTP $HTTP_CODE"
fi

# 13.2 Invalid provider ID
req GET "$BASE/providers/000000000000000000000000"
if [[ "$HTTP_CODE" =~ ^4 ]]; then
  log_pass "13.2 Invalid provider ID handled (HTTP $HTTP_CODE)"
else
  log_fail "13.2 Invalid provider ID" "Expected 4xx, got HTTP $HTTP_CODE"
fi

# 13.3 Cross-user access (customer accessing provider endpoint)
AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"
req GET "$BASE/providers/me"
if [[ "$HTTP_CODE" =~ ^4 ]]; then
  log_pass "13.3 Cross-role access blocked (HTTP $HTTP_CODE)"
else
  log_warn "13.3 Cross-role access" "Customer can access provider endpoint (HTTP $HTTP_CODE)"
fi

# 13.4 Duplicate registration
AUTH_HEADER=""
req POST "$BASE/auth/register/customer" '{"name":"Dup","email":"qa_cust_1781627214@test.com","password":"Test@123","phone":"01899999999"}'
if [[ "$HTTP_CODE" =~ ^4 ]]; then
  log_pass "13.4 Duplicate registration rejected (HTTP $HTTP_CODE)"
else
  log_fail "13.4 Duplicate registration" "Expected 4xx, got HTTP $HTTP_CODE"
fi

# 13.5 SQL/NoSQL injection attempt
req POST "$BASE/auth/login" '{"email":"{\"$gt\":\"\"}","password":"{\"$gt\":\"\"}"}'
if [[ "$HTTP_CODE" =~ ^4 ]]; then
  log_pass "13.5 NoSQL injection rejected (HTTP $HTTP_CODE)"
else
  log_fail "13.5 NoSQL injection" "HTTP $HTTP_CODE"
fi

# 13.6 XSS in name
req POST "$BASE/auth/register/customer" '{"name":"<script>alert(1)</script>","email":"xss_1781627214@test.com","password":"Test@123","phone":"01800000000"}'
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  if echo "$BODY" | grep -q "<script>"; then
    log_fail "13.6 XSS not sanitized" "Script tag in response"
  else
    log_pass "13.6 XSS sanitized or escaped (HTTP $HTTP_CODE)"
  fi
else
  log_pass "13.6 XSS registration rejected (HTTP $HTTP_CODE)"
fi

# 13.7 Expired/invalid token
AUTH_HEADER="Authorization: Bearer invalid.token.here"
req GET "$BASE/bookings/my"
if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" ]]; then
  log_pass "13.7 Invalid token rejected (HTTP $HTTP_CODE)"
else
  log_fail "13.7 Invalid token" "Expected 401/403, got HTTP $HTTP_CODE"
fi

# 13.8 Cancel booking flow
if [[ -n "$BOOKING_ID" ]]; then
  # Create another booking to test cancel
  AUTH_HEADER="Authorization: Bearer $CUST_TOKEN"
  req POST "$BASE/bookings" "{\"providerId\":\"$PROV_ID\",\"serviceCategory\":\"ELECTRICIAN\",\"scheduledDate\":\"2026-06-25T10:00:00\",\"description\":\"Cancel test\",\"address\":\"456 Test Rd\"}"
  CANCEL_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null || echo "")
  if [[ -n "$CANCEL_ID" ]]; then
    req PUT "$BASE/bookings/$CANCEL_ID/cancel"
    if [[ "$HTTP_CODE" == "200" ]]; then
      log_pass "13.8 Cancel booking (HTTP $HTTP_CODE)"
    else
      log_fail "13.8 Cancel booking" "HTTP $HTTP_CODE"
    fi
  fi
fi

echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  TEST SUMMARY                       ║"
echo "╠══════════════════════════════════════════════════════╣"
printf "║  ✅ Passed:  %-3s                                    ║\n" "$PASS"
printf "║  ❌ Failed:  %-3s                                    ║\n" "$FAIL"
printf "║  ⚠️  Warned: %-3s                                    ║\n" "$WARN"
TOTAL=$((PASS+FAIL+WARN))
printf "║  📊 Total:   %-3s                                    ║\n" "$TOTAL"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "=== FULL RESULTS ==="
echo -e "$RESULTS"
