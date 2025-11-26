# Quick Email Automation Test Guide

## 🚀 Fastest Way to Test Email Automation

### Method 1: Watch Backend Logs (Easiest)

1. **Start your backend server:**
   ```bash
   cd backend-system
   npm start
   ```

2. **Watch the console** - When emails are sent, you'll see:
   ```
   📧 Application status email sent to user@example.com
   ✅ Email sent successfully to user@example.com (Message ID: ...)
   ```

3. **Test by changing an application status:**
   - Log in as a company
   - Go to Applications page
   - Change any application status to "shortlisted" or "accepted"
   - **Immediately check backend console** - you should see the email log!

### Method 2: Use Test Email Endpoints

I've created test endpoints you can use:

#### Test Application Status Email:
```bash
curl -X POST http://localhost:5000/api/test-email/application-status \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

#### Test Company Approval Email:
```bash
curl -X POST http://localhost:5000/api/test-email/company-approval \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

#### Test Company Rejection Email:
```bash
curl -X POST http://localhost:5000/api/test-email/company-rejection \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

**Or use Postman/Thunder Client:**
- URL: `http://localhost:5000/api/test-email/application-status`
- Method: POST
- Body (JSON): `{"email": "your-email@gmail.com"}`

### Method 3: Real-World Test

1. **Create a test application:**
   - Register as a job seeker
   - Apply to a job
   - Note the email address

2. **As a company:**
   - Log in as the company that posted the job
   - Go to Applications
   - Change status to "shortlisted"
   - **Check backend logs** for: `📧 Application status email sent to...`
   - **Check the job seeker's email inbox** (and spam folder)

3. **As an admin:**
   - Log in as admin
   - Approve a company
   - **Check backend logs** for: `📧 Approval email sent to...`
   - **Check the company's email inbox**

## ✅ Success Indicators

### Backend Console Shows:
```
✅ Email service configured and verified successfully
📧 SMTP Host: smtp.gmail.com
📧 From Address: JobIFY <jobifyrwanda@gmail.com>
```

### When Email is Sent:
```
📧 Application status email sent to user@example.com
✅ Email sent successfully to user@example.com (Message ID: ...)
```

### Email Appears In:
- Recipient's inbox (check spam folder too)
- Subject line matches: "Application Status Update: shortlisted - [Job Title]"

## ❌ If It's Not Working

### Check Backend Startup:
If you see:
```
⚠️ Email service not fully configured
📋 Current env check: { SMTP_HOST: '✗ Missing', ... }
```
**Solution:** Set SMTP environment variables in Render dashboard or .env file

### Check When Sending:
If you see:
```
❌ Failed to send application status email: [error]
📭 Email skipped (transporter unavailable)
```
**Solution:** Check SMTP credentials are correct

### No Logs Appearing:
**Solution:** Make sure you're actually triggering the action (changing status, approving company, etc.)

## 🎯 Quick Checklist

- [ ] Backend shows: `✅ Email service configured and verified successfully`
- [ ] When changing application status, backend shows: `📧 Application status email sent to...`
- [ ] Email appears in recipient's inbox (check spam)
- [ ] Email content looks correct

## 📝 What Gets Automated

✅ **Application Status Changes:**
- When company changes status to "shortlisted" → Email sent
- When company changes status to "accepted" → Email sent
- When company changes status to "rejected" → Email sent
- When company changes status to "interview" → Email sent

✅ **Company Approval:**
- When admin approves company → Approval email sent
- When admin rejects company → Rejection email sent

## 💡 Pro Tip

**The easiest way:** Just watch your backend console while using the app. Every time an email should be sent, you'll see a log message. If you see the log, automation is working! ✅

