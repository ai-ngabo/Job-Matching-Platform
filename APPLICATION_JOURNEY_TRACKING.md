# JobIFY Application Journey & Email Tracking System

## Overview
This document outlines a comprehensive system to track and notify candidates about their job application journey from submission to final outcome.

## Application Journey Stages

```
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION JOURNEY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: APPLICATION SUBMITTED ✅                              │
│  ├─ Email: "Application Confirmation"                          │
│  ├─ Status: Submitted                                           │
│  └─ Timestamp: appliedAt                                        │
│                                                                 │
│  STAGE 2: UNDER REVIEW 📊                                       │
│  ├─ Email: "Your Application is Being Reviewed"                │
│  ├─ Status: reviewing                                           │
│  └─ Timestamp: statusHistory[].changedAt                        │
│                                                                 │
│  STAGE 3: SHORTLISTED 🌟                                        │
│  ├─ Email: "Great News! You've Been Shortlisted"               │
│  ├─ Status: shortlisted                                         │
│  └─ Action: Interview scheduling option                        │
│                                                                 │
│  STAGE 4: INTERVIEW SCHEDULED 📅                                │
│  ├─ Email: "Interview Scheduled - Details Attached"            │
│  ├─ Status: interview                                           │
│  ├─ Data: interview.scheduledAt, interview.interviewType      │
│  └─ Details: Date, time, link (video/in-person)               │
│                                                                 │
│  STAGE 5: OFFER/ACCEPTANCE 🎉                                   │
│  ├─ Email: "Job Offer Extended!"                               │
│  ├─ Status: accepted                                            │
│  └─ Action: Offer letter attachment                            │
│                                                                 │
│  OR                                                             │
│                                                                 │
│  STAGE 5 (ALT): REJECTED ❌                                     │
│  ├─ Email: "Thank You for Applying"                            │
│  ├─ Status: rejected                                            │
│  └─ Note: Company feedback (optional)                          │
│                                                                 │
│  STAGE 6: FINAL OUTCOME 📋                                      │
│  ├─ Application complete                                        │
│  ├─ Full journey visible in dashboard                           │
│  └─ Status history shown to candidate                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Email Notifications Strategy

### 1. **Application Submitted Email**
**When:** Immediately after job seeker clicks "Apply"
**To:** Job seeker
**Subject:** "Application Submitted to {CompanyName} for {JobTitle}"
**Body:**
```
Dear {CandidateName},

Thank you for applying to the {JobTitle} position at {CompanyName}!

Your application has been successfully submitted. The hiring team will review your 
application and get back to you within 3-5 business days.

In the meantime, you can:
- Track your application status in your JobIFY dashboard
- Continue browsing other job opportunities
- Update your profile to improve your chances

Application ID: {ApplicationID}
Position: {JobTitle}
Company: {CompanyName}
Applied Date: {AppliedDate}

Visit your dashboard: {DashboardLink}

Best of luck!
JobIFY Team
```

### 2. **Under Review Email**
**When:** Company clicks "Under Review" button
**To:** Job seeker
**Subject:** "Update: Your Application is Being Reviewed by {CompanyName}"
**Body:**
```
Dear {CandidateName},

Good news! Your application for the {JobTitle} position at {CompanyName} is now 
being actively reviewed by the hiring team.

We appreciate your interest and will notify you as soon as there's an update.

Current Status: UNDER REVIEW
Position: {JobTitle}
Company: {CompanyName}

Track progress: {DashboardLink}

Best regards,
JobIFY Team
```

### 3. **Shortlisted Email**
**When:** Company clicks "Shortlist" button
**To:** Job seeker
**Subject:** "Congratulations! You've Been Shortlisted by {CompanyName}"
**Body:**
```
Dear {CandidateName},

Congratulations! You've been shortlisted for the {JobTitle} position at {CompanyName}!

Your qualifications and experience impressed the hiring team. The next step is 
typically an interview or assessment.

What's Next:
- Wait for the company to contact you with interview details
- Review the job description and company profile
- Prepare for potential interview questions

Current Status: SHORTLISTED
Position: {JobTitle}
Company: {CompanyName}

View full application: {DashboardLink}

Exciting times ahead!
JobIFY Team
```

### 4. **Interview Scheduled Email**
**When:** Company clicks "Interview" button with date/time
**To:** Job seeker
**Subject:** "Interview Scheduled: {CompanyName} - {JobTitle}"
**Body:**
```
Dear {CandidateName},

Your interview has been scheduled! Here are the details:

INTERVIEW DETAILS
─────────────────
Position: {JobTitle}
Company: {CompanyName}
Date: {InterviewDate}
Time: {InterviewTime}
Duration: {Duration} minutes
Type: {InterviewType} (Video Call / In-Person / Phone)
Location/Link: {InterviewLink}

PREPARATION TIPS
────────────────
1. Test your technology 15 minutes before
2. Choose a quiet, well-lit location
3. Dress professionally
4. Have a copy of your resume ready
5. Prepare examples of your work

Calendar Invite: {CalendarLink}
Interview Link: {InterviewLink}

Questions? Contact: {CompanyEmail}

Good luck!
JobIFY Team
```

### 5. **Offer/Acceptance Email**
**When:** Company clicks "Accepted" button
**To:** Job seeker
**Subject:** "Job Offer: {JobTitle} at {CompanyName}"
**Body:**
```
Dear {CandidateName},

Wonderful news! We're pleased to extend a job offer for the {JobTitle} position 
at {CompanyName}.

The hiring team was impressed with your skills and experience. We believe you'll 
be a great fit for our team.

OFFER DETAILS
─────────────
Position: {JobTitle}
Department: {Department}
Location: {Location}
Salary: {Salary}
Start Date: {StartDate}

NEXT STEPS
──────────
1. Review the attached offer letter
2. Sign and return within 5 business days
3. Our HR team will contact you with onboarding information

Offer Letter: {OfferLetterLink}
HR Contact: {HRContactEmail}

Congratulations on this exciting opportunity!
JobIFY Team
```

### 6. **Rejection Email**
**When:** Company clicks "Reject" button
**To:** Job seeker
**Subject:** "Application Update: {CompanyName}"
**Body:**
```
Dear {CandidateName},

Thank you for your interest in the {JobTitle} position at {CompanyName}. 
After careful consideration, we've decided to move forward with other candidates 
whose qualifications more closely matched the role requirements.

While this wasn't the outcome we hoped for, we truly appreciate the time you invested 
in applying and interviewing with us.

FEEDBACK (if provided by company)
──────────────────────────────────
{CompanyFeedback}

NEXT STEPS
──────────
- Don't be discouraged! Many successful candidates are rejected before finding the right fit
- Review your profile and skills
- Continue applying to similar positions
- Consider our feedback for future applications

Future Opportunities:
We'd love to keep you in mind for future positions that may be a better match.
Visit JobIFY frequently for new opportunities at {CompanyName}.

All the best!
JobIFY Team
```

## Database Schema - Application Model Updates

```javascript
// Existing Fields (Already in place)
statusHistory: [{
  status: String,           // 'submitted', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected'
  changedAt: Date,
  changedBy: String,        // 'company' or 'system'
  note: String              // Company's note for this status change
}]

// Interview Details
interview: {
  scheduledAt: Date,
  interviewType: String,    // 'video', 'phone', 'in-person'
  completed: Boolean,
  interviewLink: String,    // Video call link (Zoom, Teams, etc.)
  location: String,         // For in-person interviews
  interviewFeedback: String // After interview
}

// Email Tracking
emailsSent: [{
  stage: String,
  emailType: String,        // 'submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'offer', 'rejection'
  sentAt: Date,
  status: String,           // 'sent', 'bounced', 'opened', 'clicked'
  openedAt: Date            // When email was opened (if tracked)
}]

// Application Outcome
finalOutcome: {
  status: String,           // 'accepted', 'rejected', 'pending', 'withdrew'
  offerAcceptedAt: Date,
  startDate: Date,
  notes: String
}
```

## Frontend - Application Dashboard Components

### 1. **Application Status Timeline** (Job Seeker Dashboard)
Shows a visual timeline of the application progress:
```
┌─ Applied ✅ (Nov 27)
├─ Under Review 📊 (Nov 28)
├─ Shortlisted 🌟 (Nov 29)
├─ Interview Scheduled 📅 (Dec 1)
│  └─ Video Interview
│     Date: Dec 5, 2:00 PM
│     Link: zoom.us/...
└─ [Pending Outcome]
```

### 2. **Application Stage Cards** (Job Seeker Dashboard)
Each stage shows:
- Status badge with icon
- Timeline indicator
- Company note (if provided)
- Next action required (if any)
- Email notification status (sent ✅ / opened 👁️)

### 3. **Company Applications Management** (Company Dashboard)
Features:
- Batch status update with notification
- Schedule interview with automatic email
- Add notes at each stage
- View email delivery status
- Candidate pipeline visualization

## Implementation Roadmap

### Phase 1: Email Infrastructure (Already Implemented)
- ✅ Email service setup (nodemailer with Gmail SMTP)
- ✅ Application status change endpoint
- ✅ Email sending on status update

### Phase 2: Email Templates Enhancement (TODO)
- [ ] Create HTML email templates
- [ ] Add company logo branding
- [ ] Include interview links in emails
- [ ] Add unsubscribe links

### Phase 3: Email Tracking (TODO)
- [ ] Track email open events
- [ ] Track link clicks in emails
- [ ] Update emailsSent array with events
- [ ] Show tracking status in dashboard

### Phase 4: Timeline UI (TODO)
- [ ] Create timeline component (React)
- [ ] Show application journey visually
- [ ] Display stage details and notes
- [ ] Add email receipt indicators

### Phase 5: Advanced Features (TODO)
- [ ] Automated reminders before interviews
- [ ] Calendar invitations (iCal format)
- [ ] SMS notifications
- [ ] Browser notifications
- [ ] Application status prediction (AI)

## Current Implementation Status

### ✅ Already Working
1. **Application Submission Email**
   - Sent via `emailService.js`
   - Notifies job seeker immediately

2. **Status Update Emails**
   - Triggered in `/routes/applications.js` PUT endpoint
   - Sent to applicant when status changes
   - Includes company notes

3. **Database Tracking**
   - statusHistory tracks all changes
   - interview object stores schedule details
   - All changes timestamped

### 🔄 In Progress / TODO
1. **Visual Timeline Display**
   - Create React component to show journey
   - Integrate with job seeker dashboard

2. **Email Tracking**
   - Track open/click events
   - Store in emailsSent array

3. **Interview Automation**
   - Calendar invites (iCal)
   - Zoom/Teams link generation
   - Reminder emails (24hrs before)

## Testing the Journey

### Manual Testing Steps:
1. **Job Seeker**: Apply for job (Email 1 sent)
2. **Company**: View application, click "Under Review" (Email 2 sent)
3. **Company**: Click "Shortlist" (Email 3 sent)
4. **Company**: Click "Interview", set date/time (Email 4 sent)
5. **Company**: Click "Accepted" (Email 5 sent)
6. **Job Seeker**: Check email inbox to verify all stages

### API Endpoints for Testing:
```bash
# Get application details
GET /api/applications/my-applications

# Update application status
PUT /api/applications/:id/status
Body: { status: 'reviewing', note: 'Initial review' }

# View stats
GET /api/applications/stats
```

## Conclusion

This comprehensive journey tracking system provides:
- ✅ Full transparency for job seekers
- ✅ Timely notifications at each stage
- ✅ Professional communication
- ✅ Easy tracking and follow-up
- ✅ Better candidate experience

The system is extensible for future enhancements like SMS, push notifications, and AI-powered candidate matching.
