# Admin Email Queue UI - Quick Start Guide

## Accessing the Email Queue Admin Panel

### Step 1: Navigate to Admin Dashboard
- Go to `/admin` in your Jobify application
- You must be logged in as an admin user

### Step 2: Click the "Emails" Tab
- In the admin dashboard, you'll see tabs: Overview, Users, Companies, Pending, Jobs, **Emails** ← click here

### Step 3: Add Your Admin Token
1. Locate the **"Admin token"** input field at the top of the panel
2. Copy your `ADMIN_HEALTH_TOKEN` value from your Render environment variables
3. Paste it into the input field
4. Click the **"Set token"** button
5. The token is now saved in your browser (localStorage) for future visits

### Step 4: View Queued Emails
- Once the token is set, the panel will display a table of queued emails
- The table shows:
  - **To**: Email recipient address
  - **Subject**: Email subject line
  - **Status**: Current status (pending, processing, sent, failed)
  - **Attempts**: Number of delivery attempts made
  - **Created**: When the email was queued
  - **Actions**: Buttons to resend or delete

## Common Tasks

### Check If Email Service is Working
1. Click the **"Check Email Health"** button (with refresh icon)
2. Wait for the result message:
   - ✅ **"Email transport verified: SendGrid"** → SendGrid is working
   - ✅ **"Email transport verified: SMTP"** → SMTP is working
   - ❌ **"Email transport not available"** → Both SendGrid and SMTP failed; check environment variables

### Manually Resend a Failed Email
1. Find the email in the queue table
2. Click the **"Resend"** button in the Actions column
3. Confirm when prompted
4. The email will be marked for immediate retry by the background worker
5. Refresh the page in 10-15 seconds to see if it was sent

### Delete a Queued Email
1. Find the email in the table
2. Click the **"Delete"** button (trash icon) in the Actions column
3. Confirm when prompted
4. Email is removed from the retry queue

### Refresh the Queue
1. Click the **"Refresh"** button (with refresh icon) at the top
2. The table will update with the latest queue state

## Understanding Email Queue Status

| Status | Meaning | Action |
|--------|---------|--------|
| **pending** | Waiting for next retry attempt | Wait or click "Resend" to retry immediately |
| **processing** | Currently being sent | Wait a few seconds and refresh |
| **sent** | Successfully delivered | None needed (will disappear from queue) |
| **failed** | Gave up after max retries | Click "Resend" to try again or "Delete" to discard |

## Email Queue Retention Policy

**Pending emails** are retried with **exponential backoff**:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay
- Attempt 4: 4 second delay
- Attempt 5: 8 second delay
- Max attempts: Configurable (default ~10-15 attempts)

If all retries fail, the email is marked as **failed** and kept in the queue for manual inspection/resend.

## Types of Emails in the Queue

The queue may contain:

### 1. **Contact Form Submissions**
- **Subject**: "New contact form submission from Jobify"
- **Recipient**: Admin alert email
- **Origin**: User filled out "Reach out to us" contact form

### 2. **Application Confirmations**
- **Subject**: "Your application has been received"
- **Recipient**: Job seeker
- **Origin**: User applied for a job

### 3. **Application Status Updates**
- **Subject**: "Application status update for [Job Title]"
- **Recipient**: Job seeker
- **Origin**: Company changed the application status

### 4. **Application Rejection/Acceptance**
- **Subject**: "Update on your application for [Job Title]"
- **Recipient**: Job seeker
- **Origin**: Company accepted/rejected the application

## Troubleshooting

### Problem: "Admin token not set. Click 'Set token' to add it."
**Solution**: 
- Paste your `ADMIN_HEALTH_TOKEN` into the input field
- Click "Set token" button
- The token should now be saved in localStorage

### Problem: "Forbidden - invalid token"
**Solution**:
- Make sure you copied the full `ADMIN_HEALTH_TOKEN` value
- Check that it matches the value in your Render environment
- Clear the token (click "Clear" button) and enter it again

### Problem: "Email health check failed"
**Solution**:
- Check that `SENDGRID_API_KEY` or `SMTP_*` environment variables are set in Render
- If SMTP is blocked (common on Render), ensure SendGrid API key is configured
- Contact support if both transports are unavailable

### Problem: Queued email shows high attempt count but still pending
**Solution**:
- This might indicate a permanent issue with that particular email address
- Check the email address is valid
- Click "Delete" to remove it from the queue
- Or click "Resend" to try again

### Problem: "No queued emails" message but I expect emails
**Solution**:
- Emails are removed from the queue once successfully sent
- If you see "No queued emails", all emails have either been delivered or deleted
- Trigger the condition again (submit contact form, apply for job, etc.) to create new queue entries
- Wait a few seconds for the email to be processed

## Advanced: Checking Email Queue via API

You can also check the email queue directly via curl (useful for debugging):

```bash
# List queued emails
curl -H "x-admin-token: YOUR_ADMIN_HEALTH_TOKEN" \
  https://your-backend.onrender.com/api/email-queue

# Resend specific email
curl -X POST -H "x-admin-token: YOUR_ADMIN_HEALTH_TOKEN" \
  https://your-backend.onrender.com/api/email-queue/EMAIL_ID/resend

# Delete specific email
curl -X DELETE -H "x-admin-token: YOUR_ADMIN_HEALTH_TOKEN" \
  https://your-backend.onrender.com/api/email-queue/EMAIL_ID

# Check health
curl -H "x-admin-token: YOUR_ADMIN_HEALTH_TOKEN" \
  https://your-backend.onrender.com/api/email-health
```

## Browser LocalStorage

Your admin token is stored in browser localStorage under the key `adminToken`. To clear it:
1. Click the **"Clear"** button in the panel, OR
2. Open browser DevTools (F12) → Application → Local Storage → Delete `adminToken`

## Questions?

Refer to:
- **Backend Email Service**: `backend-system/utils/emailService.js` - Contains SendGrid/SMTP logic and queue worker
- **Email Queue Model**: `backend-system/models/EmailQueue.js` - MongoDB schema for queued emails
- **API Endpoints**: `backend-system/routes/email-queue.js` and `email-health.js`
- **Admin Routes**: `backend-system/routes/admin.js` - General admin endpoints
- **Contact Route**: `backend-system/routes/contact.js` - Handles contact form submissions
