# 🚀 QUICK START - EMAIL & GOOGLE OAUTH

## ⏱️ 5-Minute Setup

### 1️⃣ Gmail App Password (2 min)
```
1. Go to myaccount.google.com
2. Security → 2-Step Verification (if not enabled)
3. Security → App passwords
4. Mail + Windows Computer
5. Copy 16-character password
```

### 2️⃣ Backend .env (1 min)
```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # 16-char app password
SMTP_FROM=JobIFY <your-email@gmail.com>
ADMIN_ALERT_EMAIL=admin@jobify.rw
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-client-id
```

### 3️⃣ Frontend .env (1 min)
```dotenv
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-client-id
```

### 4️⃣ Restart Services (1 min)
```bash
# Terminal 1
cd backend-system
npm run dev

# Terminal 2
cd frontend-system
npm run dev
```

---

## 🧪 Testing (2 minutes)

### Test Email Service
```bash
curl -X POST http://localhost:5000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```
✅ Should receive test email within 30 seconds

### Test Registration Email
1. Open http://localhost:5173
2. Click "Sign Up"
3. Create account
4. ✅ Should receive welcome email

### Test Google OAuth
1. Click "Sign up with Google"
2. Select your Google account
3. ✅ Should redirect to dashboard
4. ✅ Should receive welcome email

### Test Application Acceptance Email
1. Company posts job
2. Job seeker applies
3. Company updates status to "accepted"
4. ✅ Job seeker should receive acceptance email with:
   - ✅ emoji
   - Job title
   - Company name
   - "Congratulations" message

---

## 📊 What Gets Sent

| Event | Email Type | Recipient |
|---|---|---|
| User registers | Welcome | User |
| User registers | Alert | Admin |
| User requests password reset | Reset link | User |
| Company updates app status | Status update | Job seeker |
| Admin approves company | Approval | Company |
| Admin rejects company | Rejection | Company |

---

## 🔍 Verify Everything Works

**Backend Logs Should Show:**
```
✅ Email service initialized...
✅ Email transporter created for smtp.gmail.com:587
✅ Email service verified and ready!
✅ Email sent successfully to xxx@gmail.com
```

**Frontend Loads Without Errors**

**Test Email Received in Inbox**

---

## ❌ Common Issues

| Issue | Fix |
|---|---|
| "Invalid login credentials" | Use 16-char app password, not regular password |
| "Connection timeout" | Check SMTP_HOST and SMTP_PORT correct |
| "No Google button" | Refresh page, check browser console |
| "Email not received" | Check spam folder, verify address |

---

## 📚 Full Documentation

- **EMAIL_SETUP_GUIDE.md** - Complete email setup
- **GOOGLE_OAUTH_SETUP.md** - Complete Google setup
- **APPLICATION_ACCEPTANCE_EMAIL.md** - Email flows
- **EMAIL_OAUTH_IMPLEMENTATION_COMPLETE.md** - Full implementation

---

## ✅ Checklist Before Going Live

- [ ] Gmail app password created (16 chars)
- [ ] All .env variables set
- [ ] Backend starts without warnings
- [ ] Frontend loads without errors
- [ ] Test email works
- [ ] Registration sends welcome email
- [ ] Google sign-up works
- [ ] Application status changes send emails
- [ ] Acceptance emails show job details
- [ ] No console errors

---

**You're ready to go! 🎉**

See the comprehensive guides for detailed instructions and troubleshooting.
