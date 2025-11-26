# Email Automation Testing Guide

## 📧 How to Verify Email Automation is Working

### 1. Check Backend Logs

When emails are sent, you'll see specific log messages in your backend console:

#### ✅ Success Messages:
```
📧 Application status email sent to user@example.com
📧 Approval email sent to company@example.com
📧 Rejection email sent to company@example.com
✅ Email sent successfully to user@example.com (Message ID: ...)
```

#### ⚠️ Warning Messages (emails still work):
```
⚠️ SMTP certificate verification warning (emails may still work)
📧 Email service initialized (certificate verification skipped)
```

#### ❌ Error Messages:
```
❌ Failed to send application status email: [error]
❌ Failed to send company approval email: [error]
📭 Email skipped (transporter unavailable)
```

### 2. Test Scenarios

#### Test 1: Application Status Email (Shortlisted)
1. **As a Company:**
   - Log in to company account
   - Go to Applications page
   - Find an application
   - Click "Shortlist" or change status to "shortlisted"
   
2. **Check Backend Logs:**
   ```
   📧 Application status email sent to [applicant-email]
   ✅ Email sent successfully to [applicant-email]
   ```

3. **Check Applicant's Email:**
   - Subject: "Application Status Update: shortlisted - [Job Title]"
   - Should contain: Job title, company name, status update message

#### Test 2: Application Status Email (Accepted)
1. **As a Company:**
   - Go to Applications page
   - Change application status to "accepted"
   
2. **Check Backend Logs:**
   ```
   📧 Application status email sent to [applicant-email]
   ✅ Email sent successfully to [applicant-email]
   ```

3. **Check Applicant's Email:**
   - Subject: "Application Status Update: accepted - [Job Title]"
   - Should contain congratulations message

#### Test 3: Company Approval Email
1. **As an Admin:**
   - Log in to admin account
   - Go to Admin Dashboard
   - Find a pending company
   - Click "Approve"
   
2. **Check Backend Logs:**
   ```
   ✅ Company approved: company@example.com
   📧 Approval email sent to company@example.com
   ✅ Email sent successfully to company@example.com
   ```

3. **Check Company's Email:**
   - Subject: "✅ Your Company Account Has Been Approved - JobIFY"
   - Should contain: Approval confirmation, dashboard link

#### Test 4: Company Rejection Email
1. **As an Admin:**
   - Find a pending company
   - Click "Reject"
   - Enter rejection reason
   
2. **Check Backend Logs:**
   ```
   ❌ Company rejected: company@example.com
   📧 Rejection email sent to company@example.com
   ✅ Email sent successfully to company@example.com
   ```

3. **Check Company's Email:**
   - Subject: "Company Account Review Update - JobIFY"
   - Should contain: Rejection notice and reason

### 3. Verify Email Service Configuration

#### Check Backend Startup Logs:
When backend starts, you should see:
```
✅ Email service configured and verified successfully
📧 SMTP Host: smtp.gmail.com
📧 From Address: JobIFY <jobifyrwanda@gmail.com>
📧 Secure: No (STARTTLS)
```

If you see warnings, emails may still work:
```
⚠️ SMTP certificate verification warning (emails may still work)
📧 Email service initialized (certificate verification skipped)
```

#### Check Environment Variables:
In your backend (Render dashboard or .env file):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jobifyrwanda@gmail.com
SMTP_PASS=qbraxrpkctfykagq
SMTP_FROM=JobIFY <jobifyrwanda@gmail.com>
```

### 4. Manual Testing Steps

#### Step-by-Step Test:

1. **Start Backend Server:**
   ```bash
   cd backend-system
   npm start
   ```
   Watch for email service initialization messages

2. **Test Application Status Change:**
   - Use a test account or real account
   - Change application status
   - Watch backend console for email logs

3. **Check Email Inbox:**
   - Check the recipient's email inbox
   - Check spam folder if not in inbox
   - Verify email content is correct

4. **Test Company Approval:**
   - Approve a test company
   - Watch backend logs
   - Check company's email

### 5. What to Look For

#### ✅ Email is Working If:
- Backend logs show: `✅ Email sent successfully`
- No error messages in logs
- Email appears in recipient's inbox (check spam too)
- Email content is correct

#### ❌ Email is NOT Working If:
- Backend logs show: `❌ Failed to send email`
- Error messages about SMTP connection
- `📭 Email skipped (transporter unavailable)`
- No email in inbox or spam

### 6. Common Issues & Solutions

#### Issue: "Email skipped (transporter unavailable)"
**Solution:** Check SMTP environment variables are set correctly

#### Issue: "SMTP transporter verification failed"
**Solution:** This is usually a certificate warning - emails may still work. Check if emails are actually being sent.

#### Issue: "Failed to send email"
**Solution:** 
- Verify SMTP credentials are correct
- Check Gmail app password is valid
- Ensure SMTP_HOST, SMTP_USER, SMTP_PASS are set

#### Issue: Emails going to spam
**Solution:**
- This is normal for transactional emails
- Tell users to check spam folder
- Consider using a professional email service (SendGrid, Mailgun) for production

### 7. Quick Test Script

You can test email sending directly:

```javascript
// In backend console or create a test route
const { sendApplicationStatusEmail } = require('./utils/emailService');

// Test email
sendApplicationStatusEmail({
  email: 'your-test-email@gmail.com',
  candidateName: 'Test User',
  companyName: 'Test Company',
  jobTitle: 'Test Job',
  newStatus: 'shortlisted',
  note: 'This is a test email'
}).then(() => {
  console.log('✅ Test email sent!');
}).catch(err => {
  console.error('❌ Test email failed:', err);
});
```

### 8. Monitoring Email Automation

#### Real-time Monitoring:
- Watch backend console logs while using the app
- Look for email-related log messages
- Check for any error patterns

#### Log Patterns to Watch:
```
✅ Good: Email sent successfully
⚠️ Warning: Certificate warning (but emails work)
❌ Bad: Failed to send email
📭 Bad: Email skipped (transporter unavailable)
```

### 9. Production Checklist

Before going live, verify:
- [ ] SMTP credentials are set in production environment
- [ ] Test emails are being sent successfully
- [ ] Email templates look correct
- [ ] All email triggers are working:
  - [ ] Application shortlisted
  - [ ] Application accepted
  - [ ] Company approved
  - [ ] Company rejected
- [ ] Error handling doesn't break the app if email fails
- [ ] Users know to check spam folder

### 10. Email Service Status

To check if email service is properly configured, look for these in backend startup:

**✅ Fully Working:**
```
✅ Email service configured and verified successfully
📧 SMTP Host: smtp.gmail.com
📧 From Address: JobIFY <jobifyrwanda@gmail.com>
```

**⚠️ Working with Warnings:**
```
⚠️ SMTP certificate verification warning
📧 Email service initialized (certificate verification skipped)
```
*(Emails should still work)*

**❌ Not Working:**
```
⚠️ Email service not fully configured
📋 Current env check: { SMTP_HOST: '✗ Missing', ... }
```
*(Need to set environment variables)*

## 🎯 Quick Verification

**Fastest way to test:**
1. Change an application status to "shortlisted"
2. Immediately check backend console for: `📧 Application status email sent to...`
3. Check the applicant's email inbox (and spam folder)
4. If you see the log message, automation is working! ✅

