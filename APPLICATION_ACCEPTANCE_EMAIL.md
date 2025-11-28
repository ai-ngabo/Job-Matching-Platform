# 📮 Application Status Email Guide - Complete Implementation

## Overview

When a company updates an application status, the job seeker automatically receives an email notification. This guide shows the complete flow from status update to email delivery.

---

## 🔄 Complete Email Flow

### Step 1: Company Updates Application Status

**Endpoint:** `PUT /api/applications/:applicationId/status`

**Request:**
```bash
curl -X PUT http://localhost:5000/api/applications/app123/status \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "note": "Congratulations! We would like to offer you the position.",
    "interviewDate": "2025-12-15T10:00:00Z",
    "interviewType": "video"
  }'
```

**Status Options:**
- `submitted` - Application received
- `reviewing` - Under review
- `shortlisted` - Advanced in process
- `interview` - Interview scheduled
- `accepted` - Offered the position ✅
- `rejected` - Not selected

### Step 2: Application Updated in Database

The `applications.js` route handler:

```javascript
// Backend file: backend-system/routes/applications.js:214

router.put('/:id/status', auth, async (req, res) => {
  // 1. Verify user is company
  if (req.user.userType !== 'company') {
    return res.status(403).json({ message: 'Only companies can update' });
  }

  // 2. Get application and populate data
  const application = await Application.findById(applicationId)
    .populate('job', 'title')
    .populate('company', 'name')
    .populate('applicant', 'email profile');

  // 3. Verify company owns this application
  if (application.company._id.toString() !== req.user.id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  // 4. Update status
  application.status = status;

  // 5. Add to history
  application.statusHistory.push({
    status: status,
    changedAt: new Date(),
    changedBy: 'company',
    note: note || ''
  });

  // 6. Handle interview scheduling if status is "interview"
  if (status === 'interview' && interviewDate) {
    application.interview = {
      scheduledAt: new Date(interviewDate),
      interviewType: interviewType || 'video',
      completed: false
    };
  }

  // 7. Save changes
  await application.save();
```

### Step 3: Email Sent Automatically

After application is saved, email is sent:

```javascript
// From: backend-system/routes/applications.js:285

// Extract email details
const applicantEmail = application.applicant?.email || application.applicantEmail;
const candidateName = application.applicantName || 
  `${application.applicant?.profile?.firstName} ${application.applicant?.profile?.lastName}`;
const companyName = application.company?.name || 'Our Company';
const jobTitle = application.jobTitle || application.job?.title || 'Position';

// Send email
if (applicantEmail) {
  await sendApplicationStatusEmail({
    email: applicantEmail,
    candidateName: candidateName.trim(),
    companyName: companyName,
    jobTitle: jobTitle,
    newStatus: status,
    note: note || ''
  });
  console.log(`📧 Application status email sent to ${applicantEmail}`);
}
```

### Step 4: Email Service Sends Email

**File:** `backend-system/utils/emailService.js`

```javascript
export const sendApplicationStatusEmail = async ({ 
  email, 
  candidateName, 
  companyName, 
  jobTitle, 
  newStatus, 
  note 
}) => {
  try {
    await sendEmail({
      to: email,
      subject: `Application Status Update: ${newStatus} - ${jobTitle}`,
      html: buildApplicationStatusHtml({ 
        candidateName, 
        companyName, 
        jobTitle, 
        newStatus, 
        note 
      })
    });
  } catch (error) {
    console.error('❌ Failed to send application status email:', error.message);
  }
};
```

### Step 5: HTML Email Rendered

The email HTML template (for "accepted" status):

```html
<div style="font-family: Arial, sans-serif; color: #0f172a;">
  <div style="text-align: center; padding: 20px 0;">
    <h1 style="font-size: 2rem;">✅</h1>
    <h2 style="color: #059669;">Application Status Update</h2>
  </div>

  <div style="padding: 20px 0;">
    <p>Hi John Doe,</p>

    <div style="background: #f8fafc; padding: 15px;">
      <p><strong>Job Position:</strong> Senior Software Engineer</p>
      <p><strong>Company:</strong> Tech Corp Ltd</p>
      <p><strong>New Status:</strong> <span style="background: #059669; color: white;">ACCEPTED</span></p>
    </div>

    <p>Congratulations! You have been selected for this position. 
       The hiring team will contact you soon with offer details.</p>

    <div style="background: #fffbeb; padding: 15px; border-left: 4px solid #fbbf24;">
      <p><strong>Note from the hiring team:</strong></p>
      <p>Congratulations! We would like to offer you the position. 
         The HR team will contact you shortly with offer details.</p>
    </div>

    <p style="margin-top: 30px;">
      <a href="https://jobify-rw.vercel.app/applications" 
         style="background: #0073e6; color: white; padding: 12px 24px;">
        View Your Applications
      </a>
    </p>
  </div>
</div>
```

### Step 6: Email Delivered to Inbox

Job seeker receives email with:
- **From:** JobIFY <jobifyrwanda@gmail.com>
- **Subject:** Application Status Update: accepted - Senior Software Engineer
- **Content:** Formatted HTML with company name, job title, and custom note

---

## 📊 Email Status Templates

### 1. Submitted Status
```
Status: submitted
Message: "Your application has been received and is waiting for review."
Emoji: 📋
Color: #3b82f6 (Blue)
```

### 2. Reviewing Status
```
Status: reviewing / under review
Message: "Your application is now under review by the hiring team."
Emoji: 👀
Color: #f59e0b (Amber)
```

### 3. Shortlisted Status
```
Status: shortlisted
Message: "Congratulations! You have been shortlisted for this position. 
          The hiring team will contact you soon with next steps."
Emoji: ⭐
Color: #10b981 (Green)
```

### 4. Interview Status
```
Status: interview
Message: "Excellent news! You have been selected for an interview. 
          Please check your email for interview scheduling details."
Emoji: 💼
Color: #0369a1 (Sky Blue)
```

### 5. Accepted Status ✅
```
Status: accepted
Message: "Congratulations! You have been selected for this position. 
          The hiring team will contact you soon with offer details."
Emoji: ✅
Color: #059669 (Emerald)
```

### 6. Rejected Status
```
Status: rejected
Message: "Thank you for your interest in this position. 
          Unfortunately, you were not selected at this time. 
          We encourage you to apply for other suitable positions."
Emoji: ❌
Color: #ef4444 (Red)
```

---

## 🔧 Configuration & Setup

### Required Environment Variables

**Backend `.env`:**
```dotenv
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jobifyrwanda@gmail.com
SMTP_PASS=qbraxrpkctfykagq
SMTP_FROM=JobIFY <jobifyrwanda@gmail.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173  # or https://jobify-rw.vercel.app for production
```

### Database Schema

**Application Model** stores:
```javascript
{
  _id: ObjectId,
  job: ObjectId,              // Reference to Job
  applicant: ObjectId,        // Reference to User (job seeker)
  applicantName: String,      // Full name
  applicantEmail: String,     // Email address
  company: ObjectId,          // Reference to User (company)
  jobTitle: String,           // Job title (denormalized)
  status: String,             // Current status
  statusHistory: [{           // All status changes
    status: String,
    changedAt: Date,
    changedBy: String,
    note: String
  }],
  interview: {                // Interview details (if status = "interview")
    scheduledAt: Date,
    interviewType: String,
    completed: Boolean
  },
  appliedAt: Date,
  updatedAt: Date
}
```

---

## ✅ Testing Application Acceptance Email

### Full Test Workflow

#### 1. Create Job (as Company)
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer COMPANY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Developer",
    "description": "We are looking for...",
    "requiredSkills": ["JavaScript", "React"],
    "experienceLevel": "senior",
    "location": "Remote",
    "salary": "$100,000 - $150,000"
  }'
```

Response includes `jobId`

#### 2. Apply for Job (as Job Seeker)
```bash
curl -X POST http://localhost:5000/api/applications/job/JOB_ID \
  -H "Authorization: Bearer SEEKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coverLetter": "I am very interested in this position..."
  }'
```

Response includes `applicationId`

#### 3. Update Status to Accepted (as Company)
```bash
curl -X PUT http://localhost:5000/api/applications/APP_ID/status \
  -H "Authorization: Bearer COMPANY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "note": "We are excited to offer you this position!"
  }'
```

#### 4. Check Backend Logs
```
✅ Email sent successfully to seeker@example.com
   📧 Subject: Application Status Update: accepted - Senior Developer
   🔑 Message ID: <ABC123@gmail.com>
   📬 Response: 250 Message accepted
```

#### 5. Check Job Seeker Email
- Should receive acceptance email within 30 seconds
- Should contain:
  - Job title: "Senior Developer"
  - Company name
  - Status: "accepted"
  - Custom note
  - "View Your Applications" button

---

## 🐛 Troubleshooting Email Delivery

### Issue 1: Email Not Sent (Silent Failure)

**Problem:** No error in logs, but email not received

**Check:**
1. Verify `FRONTEND_URL` is set correctly
2. Check email configuration:
   ```bash
   # Check backend logs on startup
   npm run dev
   # Look for: "✅ Email service initialized"
   ```
3. Verify application has `applicant.email` field:
   ```bash
   # Check database
   db.applications.findOne({_id: ObjectId("APP_ID")})
   # Should have applicantEmail field
   ```

### Issue 2: "Email sent successfully" but not received

**Problem:** Backend shows success, but email doesn't arrive

**Solutions:**
1. Check spam/junk folder
2. Verify recipient email is correct:
   ```bash
   # Check application
   db.applications.findOne({_id: ObjectId("APP_ID")})
   # Check: applicantEmail, applicant.email
   ```
3. Check Gmail app password:
   - If invalid, regenerate at [Google App Passwords](https://myaccount.google.com/apppasswords)

### Issue 3: "Error: Invalid login credentials"

**Problem:** Email service can't authenticate with Gmail

**Solution:**
1. Verify `SMTP_USER` matches Gmail address
2. Verify `SMTP_PASS` is 16-character app password (not regular password)
3. Regenerate app password at Gmail settings
4. Restart backend after updating `.env`

### Issue 4: Wrong applicant email in database

**Problem:** Email sends but to wrong person

**Solution:**
1. Check Application model stores email correctly
2. When creating application, ensure:
   ```javascript
   application.applicantEmail = req.user.email;
   application.applicant = req.user.id;
   ```
3. Verify both user has email field populated

---

## 📧 Email Content Customization

### Customize Email Message

Edit `backend-system/utils/emailService.js`:

```javascript
// Line 177: Find this template
const statusMessages = {
  'accepted': 'Your custom message here...'
};

// Add your own message
statusMessages['accepted'] = 'Exciting news! We would like to welcome you to our team. Please check your email for next steps.';
```

### Customize Email Styling

Edit HTML in `buildApplicationStatusHtml` function:

```javascript
// Change colors
return `
  <div style="background: #YOUR_COLOR; ...">
    ...
  </div>
`;

// Change layout
// Change button text
// Add/remove sections
```

### Customize Email Subject

Edit in `sendApplicationStatusEmail`:

```javascript
await sendEmail({
  to: email,
  subject: `[JobIFY] ${newStatus.toUpperCase()}: ${jobTitle}`, // Custom format
  html: buildApplicationStatusHtml({...})
});
```

---

## 🚀 Production Deployment

### Render Configuration

Set environment variables in Render Dashboard:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=JobIFY <your-email@gmail.com>
FRONTEND_URL=https://jobify-rw.vercel.app
```

### Monitor in Production

Check Render logs:
```bash
# SSH into Render or check dashboard logs
# Search for "Email sent successfully" or "Failed to send email"
```

---

## ✅ Verification Checklist

Before production:

- [ ] Email service initialized on startup
- [ ] Test email endpoint works: `/api/test-email`
- [ ] Registration sends welcome email
- [ ] Password reset sends reset link email
- [ ] Application status change sends email
- [ ] All 6 status types send correct emails
- [ ] Email subject includes job title
- [ ] Email body includes company name
- [ ] Custom notes appear in email
- [ ] Email links work (View Applications button)
- [ ] Acceptance email specifically marked with ✅ emoji
- [ ] Production `FRONTEND_URL` set correctly
- [ ] Gmail app password valid (not regular password)
- [ ] Email service logs show successful sends

---

## 📞 Support

When reporting email issues, provide:

1. **Backend logs** showing error
2. **Application ID** that failed to send
3. **Job seeker email address**
4. **Status being set**
5. **Timestamp** of the attempt

---

**Application status emails are critical for job seeker communication. Test thoroughly!**
