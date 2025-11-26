#!/bin/bash

echo "=========================================="
echo "FULL-STACK VERIFICATION TEST"
echo "=========================================="
echo ""

# Test 1: Backend Health
echo "TEST 1: Backend Health Check"
echo "---"
HEALTH=$(curl -s https://job-matching-platform-zvzw.onrender.com/api/health)
echo "Backend Response: $HEALTH"
echo ""

# Test 2: Check if database is connected
if echo "$HEALTH" | grep -q '"database":"Connected"'; then
    echo "✅ Database is CONNECTED"
else
    echo "❌ Database connection issue"
fi
echo ""

# Test 3: Frontend status
echo "TEST 2: Frontend Deployment"
echo "---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend is ACCESSIBLE (HTTP $HTTP_CODE)"
else
    echo "⚠️ Frontend returned HTTP $HTTP_CODE"
fi
echo ""

# Test 4: CORS test
echo "TEST 3: CORS Configuration"
echo "---"
CORS_TEST=$(curl -s -H "Origin: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -o /dev/null -w "%{http_code}" \
  https://job-matching-platform-zvzw.onrender.com/api/health)
echo "CORS preflight test returned: HTTP $CORS_TEST"
if [ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ]; then
    echo "✅ CORS appears to be ENABLED"
else
    echo "⚠️ CORS test returned: $CORS_TEST (check Render env vars)"
fi
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo "Backend: https://job-matching-platform-zvzw.onrender.com"
echo "Frontend: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app"
echo ""
echo "To manually verify:"
echo "1. Open frontend in browser"
echo "2. Open DevTools (F12) → Console"
echo "3. Look for: '🔗 Connecting to backend at:'"
echo "4. Try to login/register"
echo "5. Check Network tab for API calls"
echo ""
