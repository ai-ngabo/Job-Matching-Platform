# SendGrid "Bad Request" Error - Troubleshooting Guide

## What Causes "Bad Request"?

SendGrid returns "Bad Request" (HTTP 400) when the email message is malformed or violates SendGrid requirements. Common causes:

### 1. **Invalid API Key** ❌
- API key doesn't exist or is expired
- API key doesn't start with `SG.`
- API key has extra spaces or is truncated

**Fix:**
```bash
# Generate a new API key in SendGrid dashboard:
# Settings → API Keys → Create API Key → Copy full key (should start with SG.)
export SENDGRID_API_KEY="SG.xxxxx..."
```

### 2. **"From" Address Not Verified** ❌
- SendGrid requires the sender email to be verified
- Default sender `no-reply@jobify.rw` might not be verified

**Fix:**
```bash
# In Render environment, set a verified sender address:
export SMTP_FROM="verified-email@yourdomain.com"

# To verify in SendGrid:
# 1. Go to Settings → Sender Authentication
# 2. Add your sender email
# 3. Click verification link in email
# 4. Use this email in SMTP_FROM
```

### 3. **Invalid Email Address Format** ❌
- Recipient email is malformed
- Missing domain or invalid format

**Fix:**
```javascript
// Good formats:
"user@example.com"
"User Name <user@example.com>"

// Bad formats:
"user"
"@example.com"
"user@"
```

### 4. **Missing Text Version** ❌
- SendGrid expects either `text` or `html` (or both)
- If only `html` is provided, a `text` version should be included

**Fix:**
```javascript
// Good:
const msg = {
  to: "user@example.com",
  from: "verified@domain.com",
  subject: "Test",
  html: "<strong>Hello</strong>",
  text: "Hello"  // ← Include text version
};

// What we now do:
const text = html.replace(/<[^>]*>/g, ''); // Strip HTML tags
```

### 5. **Rate Limiting** ⏱️
- SendGrid account is rate-limited
- Too many emails sent too quickly
- Free tier limits

**Fix:**
```bash
# Check SendGrid account limits
# Go to Settings → General → Plan Details
# Consider upgrading plan if necessary

# Implement exponential backoff (already done in code)
```

### 6. **Incorrect Message Format** ❌
- Required fields missing
- Invalid field types

**Fix:**
```javascript
// Required fields:
const msg = {
  to: "recipient@example.com",        // string or array
  from: "sender@domain.com",          // string (required)
  subject: "Email Subject",           // string (required)
  html: "<p>Body</p>",               // string or text field required
  // OR
  text: "Body"
};
```

## Diagnostic Steps

### Step 1: Check API Key
```bash
# Should start with SG. and be 100+ characters
echo $SENDGRID_API_KEY
```

### Step 2: Verify Sender Address
1. Go to SendGrid Dashboard
2. Settings → Sender Authentication
3. Verify that your sender email is listed
4. If not, add and verify it

### Step 3: Run Diagnostic Script
```bash
# On your local machine:
node backend-system/scripts/diagnose_sendgrid.js

# On Render (if you have shell access):
node backend-system/scripts/diagnose_sendgrid.js
```

### Step 4: Check Render Logs
```bash
# Look for SendGrid error messages:
# "SendGrid send failed: Bad Request"
# Check API error details:
# "Errors: [{ "message": "...", "field": "..." }]"
```

## Current Fix Applied

We've updated the code to:
1. ✅ Always include both `html` and `text` versions
2. ✅ Strip HTML tags for text version automatically
3. ✅ Add better logging of SendGrid errors
4. ✅ Include more error details in logs

```javascript
// New code:
const sgMsg = {
  to,
  from: msg.from,
  subject: msg.subject,
  html: msg.html,
  text: msg.html?.replace(/<[^>]*>/g, '') || 'Email from JobIFY'
};
```

## Quick Checklist

Before you debug further:

- [ ] SENDGRID_API_KEY is set and starts with `SG.`
- [ ] SENDGRID_API_KEY has no extra spaces or truncation
- [ ] SMTP_FROM (sender email) is verified in SendGrid
- [ ] Email recipient address is valid (user@domain.com)
- [ ] Email subject is not empty
- [ ] Email body (html) is not empty
- [ ] No rate limiting (check SendGrid usage)

## What to Do Next

1. **Verify your API key** in SendGrid dashboard
2. **Verify your sender email** in SendGrid Settings
3. **Update Render env vars** with correct values:
   ```
   SENDGRID_API_KEY=SG.xxxxxx...
   SMTP_FROM=noreply@yourdomain.com
   ```
4. **Redeploy** your Render service
5. **Check logs** for the updated error messages

## Testing

Once fixed, you can test with:

```bash
# Frontend: Submit contact form or apply for job
# Check Render logs for:
# "✅ SendGrid email sent to..."

# OR use the admin panel:
# Go to /admin → Emails tab
# Use token to check queue status
```

## If Still Failing

The system will:
1. Fail SendGrid with detailed error
2. Try SMTP (will timeout on Render)
3. Enqueue to database for retry
4. Use admin panel to resend or debug

See `ADMIN_EMAIL_QUEUE_UI_QUICK_START.md` for managing queued emails.
