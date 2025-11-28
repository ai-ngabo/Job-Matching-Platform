# 📧 Email Service Setup & Troubleshooting Guide

## Overview

The JobIFY platform sends emails for:
- User registration confirmations
- Password reset links
- Application status updates (submitted, reviewing, shortlisted, interview, accepted, rejected)
- Admin alerts for new registrations
- Company approval/rejection notifications

---

## 🔧 Email Configuration

### Step 1: Gmail Account Setup

The platform uses Gmail SMTP to send emails. Follow these steps:

#### 1a. Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com)
2. Click "Security" on the left sidebar
3. Find "How you sign in to Google"
4. Enable "2-Step Verification"
5. Follow the prompts to complete setup

#### 1b. Generate App Password
1. Go back to [Google Account Settings](https://myaccount.google.com)
2. Click "Security" on the left sidebar
3. Scroll down to "App passwords"
4. Select "Mail" and "Windows Computer" (or your device)
5. Google will generate a 16-character password
6. **Copy this password** - you'll need it for `SMTP_PASS`

#### 1c. Update Backend Environment Variables

Edit `.env` in `backend-system/`:

```dotenv
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=JobIFY <your-email@gmail.com>

# Admin email for receiving alerts
ADMIN_ALERT_EMAIL=admin@example.com
```

**Important:** Use the **16-character app password**, not your regular Gmail password.

### Step 2: Environment Variables Configuration

Complete backend `.env` file:

```dotenv
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=jobify

# JWT
JWT_SECRET=your-super-secret-key-at-least-32-characters

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jobifyrwanda@gmail.com
SMTP_PASS=qbraxrpkctfykagq
SMTP_FROM=JobIFY <jobifyrwanda@gmail.com>

# Admin Alerts
ADMIN_ALERT_EMAIL=admin@jobify.rw

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Server
PORT=5000
NODE_ENV=development
PASSWORD_TOKEN_EXPIRY_MIN=30
```

### Step 3: Frontend Configuration

Update `.env` in `frontend-system/`:

```dotenv
# API
VITE_API_BASE_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000

# Google OAuth (same as backend)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 🧪 Testing Email Service

### Test 1: Backend Health Check

```bash
# Check backend is running
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"Backend is working!"}
```

### Test 2: Email Sending Endpoint

The backend has a test email endpoint:

```bash
curl -X POST http://localhost:5000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "subject": "Test Email",
    "message": "This is a test email from JobIFY"
  }'
```

Expected response:
```json
{
  "message": "Test email sent successfully",
  "recipient": "your-email@example.com"
}
```

**Check your email inbox for the test message.**

### Test 3: Registration Email

1. Open frontend at `http://localhost:5173`
2. Go to "Sign Up"
3. Register as a job seeker
4. Check your email for welcome message
5. **Check backend logs** for email sending confirmation:
   ```
   ✅ Email sent successfully to your-email@example.com
      📧 Subject: Welcome to JobIFY!
      🔑 Message ID: <message-id>
      📬 Response: 250 Message accepted
   ```

### Test 4: Password Reset Email

1. Go to Login page
2. Click "Forgot Password"
3. Enter your email
4. Check your email for reset link
5. Check backend logs for confirmation

### Test 5: Application Status Email

1. Login as a company user
2. Create a test job (if needed)
3. Have a job seeker apply for the job
4. Go to Applications tab
5. Update application status to "Accepted"
6. Check job seeker's email for acceptance notification
7. Check backend logs for email sending

---

## 🐛 Troubleshooting Email Issues

### Issue 1: "Email service NOT configured" in logs

**Problem:** You see this in backend logs:
```
❌ Email service NOT configured - missing environment variables:
   - SMTP_USER
   - SMTP_PASS
```

**Solution:**
1. Check `.env` file exists in `backend-system/`
2. Verify all SMTP variables are set
3. Restart backend: `npm run dev`

### Issue 2: Email not sending - "Invalid login credentials"

**Problem:** Backend logs show:
```
❌ Failed to send email to xxx@gmail.com
   ⚠️  Error Message: Invalid login credentials
```

**Solution:**
1. Verify Gmail app password (16 characters with spaces)
2. Confirm 2-Factor Authentication is enabled
3. Check `SMTP_USER` matches your Gmail address
4. **Important:** Use **app password**, not regular password
5. Regenerate app password:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select Mail and Windows Computer
   - Replace `SMTP_PASS` in `.env`

### Issue 3: Email not sending - "SMTP connection timeout"

**Problem:** Backend logs show:
```
❌ Failed to send email
   ⚠️  Error Message: connect ETIMEDOUT
```

**Solution:**
1. Check internet connection
2. Verify `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`
3. Check if Gmail SMTP is blocked:
   - Go to [Gmail Security](https://myaccount.google.com/security)
   - Enable "Less secure app access" (if needed)
4. Restart backend

### Issue 4: Email verification failure

**Problem:** Backend logs show:
```
⚠️  Email service verification warning: connect timeout
```

**Solution:**
1. This is a warning, not a fatal error
2. Email should still work when sent
3. If emails aren't sending, check other troubleshooting steps

### Issue 5: Emails show "From: noreply@jobify.rw" but not sending

**Problem:** Email template shows wrong sender

**Solution:**
1. Check `SMTP_FROM` in `.env`:
   ```dotenv
   SMTP_FROM=JobIFY <your-email@gmail.com>
   ```
2. The display name (JobIFY) is what users see
3. The email (your-email@gmail.com) must match `SMTP_USER`

---

## 📧 Email Flows in Application

### Registration Flow
```
User registers → User.save() called → Pre-save hook hashes password
                                    ↓
                         sendRegistrationEmail() ✅
                                    ↓
                         sendAdminRegistrationAlert() ✅
```

### Application Status Update Flow
```
Company updates application status → Application.save() called
                                              ↓
                          sendApplicationStatusEmail() ✅
                                              ↓
                            Job seeker receives email
```

### Supported Application Statuses & Emails
- ✅ **submitted** - "Your application has been received and is waiting for review"
- ✅ **reviewing** - "Your application is now under review"
- ✅ **shortlisted** - "Congratulations! You have been shortlisted"
- ✅ **interview** - "Excellent news! You have been selected for an interview"
- ✅ **accepted** - "Congratulations! You have been selected for this position"
- ✅ **rejected** - "Unfortunately, you were not selected at this time"

### Google OAuth Sign-up Flow
```
User clicks "Sign up with Google" → Google verification ✅
                                         ↓
                              Create User in DB ✅
                                         ↓
                        sendRegistrationEmail() ✅
                                         ↓
                          Generate JWT token ✅
                                         ↓
                              Redirect to dashboard
```

---

## 🔐 Email Security

### 1. Password Reset Security
- Reset tokens expire in 30 minutes (configurable via `PASSWORD_TOKEN_EXPIRY_MIN`)
- Tokens are hashed before storage
- One-time use only

### 2. Google OAuth Security
- Tokens verified with Google servers
- Token audience validated
- No unencrypted passwords stored for OAuth users

### 3. Email Privacy
- Emails are not stored/archived
- Sent via encrypted TLS connection (port 587)
- User emails only visible to authenticated users

---

## 📱 Production Email Configuration

For production deployment on Render/Vercel:

### 1. Add Environment Variables to Render Dashboard

Go to Render Dashboard → Your Backend Service → Environment:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=app-password-16-chars
SMTP_FROM=JobIFY <your-gmail@gmail.com>
ADMIN_ALERT_EMAIL=admin@jobify.rw
FRONTEND_URL=https://jobify-rw.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
MONGODB_URI=production-mongodb-url
JWT_SECRET=production-secret
```

### 2. Update Frontend URL for Email Links

Emails will include links back to the application:
- "View Your Applications" links to `${FRONTEND_URL}/applications`
- "Go to Dashboard" links to `${FRONTEND_URL}/dashboard`

Make sure `FRONTEND_URL` is set correctly.

### 3. Test Production Email

After deployment, test by:
1. Creating a new account
2. Checking email logs in Render Dashboard
3. Verifying welcome email received

---

## 📊 Monitoring Email Sending

### Check Backend Logs

The email service provides detailed logs:

```
📧 Initializing Email Service...
   Host: smtp.gmail.com
   Port: 587
   User: jobifyrwanda@gmail.com
   Secure (TLS): false
   From: JobIFY <jobifyrwanda@gmail.com>

✅ Email transporter created for smtp.gmail.com:587
✅ Email service verified and ready!

✅ Email sent successfully to user@example.com
   📧 Subject: Welcome to JobIFY!
   🔑 Message ID: <ABCD1234@gmail.com>
   📬 Response: 250 Message accepted
```

### Monitor in Render Dashboard

1. Go to Render Dashboard
2. Select your backend service
3. Click "Logs"
4. Search for email-related messages:
   - "✅ Email sent successfully"
   - "❌ Failed to send email"
   - "Email service initialized"

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Gmail 2-Factor Authentication enabled
- [ ] App password generated (16 characters)
- [ ] `.env` file has all SMTP variables
- [ ] `SMTP_USER` matches your Gmail address
- [ ] `SMTP_PASS` is the app password (not regular password)
- [ ] Backend starts without email configuration warnings
- [ ] Test email endpoint returns success
- [ ] Registration sends welcome email
- [ ] Password reset sends email with link
- [ ] Application status updates send emails to applicants
- [ ] Company approval/rejection emails send to companies
- [ ] All emails come from the configured sender

---

## 🆘 Still Having Issues?

1. **Check Backend Logs:**
   ```bash
   # SSH into Render or check local logs
   npm run dev
   # Look for email-related messages
   ```

2. **Verify Email Configuration:**
   ```bash
   curl -X POST http://localhost:5000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test@gmail.com"}'
   ```

3. **Check Gmail App Password:**
   - Make sure you used app password, not regular password
   - Regenerate if necessary

4. **Verify Network:**
   - Ensure SMTP port 587 is not blocked by firewall
   - Check internet connection

5. **Contact Gmail Support:**
   - If all else fails, check [Gmail Help Center](https://support.google.com)

---

**Email service is critical for user experience. Test thoroughly before deploying to production!**
