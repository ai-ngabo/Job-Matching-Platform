# Quick Debugging Guide - Company Workflow

## 🔍 Troubleshooting by Symptom

### Problem: "Post New Job" button doesn't open form

**Quick Fixes**:
1. Open browser console (F12)
   - Check for JavaScript errors
   - Look for red error messages
   
2. Verify the button is visible
   - Check that you're on `/jobs/manage` route (company user)
   - Button should be in top-right corner of page
   
3. Check if modal is rendering but not visible
   - Inspect element on button: right-click → Inspect
   - Look for `.job-form-overlay` in DOM
   - Check if it's there but styled with `display: none` or `z-index` issue

**Debug Code**:
```javascript
// Open browser console and paste this:
const button = document.querySelector('[onClick*="handleOpenNew"]');
console.log('Button found:', !!button);
console.log('Button visible:', button?.offsetParent !== null);
```

---

### Problem: Action buttons in job cards are not visible

**Visible Signs**:
- You can click in the area but see no buttons
- Job card is there but right side is empty
- Buttons appear on hover but not default state

**Quick Fixes**:
1. Check CSS is loaded
   ```javascript
   // In console:
   const style = document.querySelector('link[href*="JobManagement.css"]');
   console.log('CSS loaded:', !!style);
   ```

2. Inspect button styling
   ```javascript
   // Right-click on empty button area → Inspect
   // Check .job-card-actions element
   // Computed styles should show:
   // - display: flex
   // - gap: 8px
   ```

3. Clear browser cache
   - Ctrl+Shift+Delete → Clear browsing data → Cache
   - Reload page: Ctrl+F5

4. Verify component file exists
   - Check: `frontend-system/src/pages/jobs/JobManagement/JobManagement.jsx`

---

### Problem: AI Match Score not showing in Applications

**Visible Signs**:
- Applications page loads
- Candidate cards show but no match score circle
- Score value shows as "undefined" or "0%"

**Quick Fixes**:
1. Check backend endpoint
   ```bash
   # In terminal, test API:
   curl -X GET http://localhost:5000/api/ai/qualification-score/[APPLICATION_ID] \
     -H "Authorization: Bearer [YOUR_TOKEN]"
   ```

2. Verify data is populated
   ```javascript
   // In browser console on Applications page:
   // Wait for page to load, then:
   const qualificationScores = window.appState?.qualificationScores;
   console.log('Scores loaded:', qualificationScores);
   ```

3. Check network requests
   - Open DevTools Network tab (F12 → Network)
   - Look for requests to `/ai/qualification-score/`
   - Should see 200 status code responses
   - If 403/401, authorization issue
   - If 404, application ID not found

4. Verify data structure in response
   ```json
   // Response should look like:
   {
     "qualificationScore": 75,
     "scoreLevel": "Good"
   }
   ```

---

### Problem: Email not received when status changes

**Quick Checks**:
1. Verify SMTP configuration in backend
   ```javascript
   // On server startup, you should see:
   // ✅ Email service verified and ready!
   // If not, environment variables are missing
   ```

2. Check email service logs
   - Look at server console output
   - Should see: `📧 Email sent successfully to [EMAIL]`
   - If missing, status update didn't trigger email

3. Test email manually
   ```bash
   # Backend: Create test script to send email
   # Or use Postman to call status update endpoint
   # Then watch server console for email logs
   ```

4. Check spam folder
   - Gmail: Check Promotions, Spam, Updates tabs
   - Outlook: Check Clutter folder
   - Add no-reply@jobify.rw to contacts to whitelist

5. Verify email configuration
   ```bash
   # Check these environment variables are set:
   echo $SMTP_HOST
   echo $SMTP_USER
   echo $SMTP_PASS
   echo $SMTP_PORT
   echo $FRONTEND_URL
   ```

---

## 🧪 Testing Checklist

### Manual Testing Steps

#### 1. Test Post New Job
- [ ] Login as company user
- [ ] Navigate to `/jobs/manage`
- [ ] Click "Post New Job" button
- [ ] Modal overlay appears
- [ ] Form fields are editable
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] See success message
- [ ] Modal closes automatically
- [ ] New job appears in list

#### 2. Test Manage Jobs Buttons
- [ ] Go to `/jobs/manage`
- [ ] Job cards are visible with metadata
- [ ] Action buttons are visible: View, Edit, Toggle, Delete
- [ ] **View Button**: Click → Navigate to job details page
- [ ] **Edit Button**: Click → Modal opens with form prefilled
- [ ] **Toggle Button**: Click → Status changes (active ↔ closed), updates in real-time
- [ ] **Delete Button**: Click → Confirmation dialog appears
- [ ] **Delete Confirm**: Click Yes → Job removed from list

#### 3. Test Applications AI Score
- [ ] Have at least one application for company's job
- [ ] Go to `/applications`
- [ ] See "Received Applications" page
- [ ] Each application card shows "AI Match Score"
- [ ] Score displays as percentage (0-100%)
- [ ] Score has color: Green (80+), Orange (60-79), Red (<60)
- [ ] Score label shows: Excellent/Good/Fair/Poor
- [ ] Multiple applications show different scores

#### 4. Test Email on Status Change
- [ ] Go to `/applications`
- [ ] Click "View" on an application
- [ ] Modal opens with status buttons
- [ ] Click a status button (e.g., "Shortlist")
- [ ] Modal closes
- [ ] Check applicant's email inbox
- [ ] Email should arrive within 30 seconds
- [ ] Email subject: `📋 Application Update: [status] - [job title]`
- [ ] Email contains: Candidate name, company name, job title, status
- [ ] Email has action link back to dashboard

---

## 🔧 Development Debugging

### Enable Verbose Logging

#### Frontend (React)
```javascript
// Add to JobManagement.jsx handleOpenNew():
const handleOpenNew = () => {
  console.log('🔵 [JobManagement] Opening new job form');
  console.log('showForm state before:', showForm);
  setEditingJob(null);
  setShowForm(true);
  console.log('🔵 [JobManagement] After setShowForm(true)');
};

// Add to JobPostForm.jsx onSubmit():
const handleSubmit = async (e) => {
  console.log('📝 [JobPostForm] Submitting form with data:', formData);
  try {
    // ... existing code
    console.log('✅ [JobPostForm] Form submitted successfully');
  } catch (err) {
    console.error('❌ [JobPostForm] Error submitting:', err);
  }
};
```

#### Backend (Node.js)
```javascript
// Add to applications.js status update endpoint:
console.log(`🔵 [Status Update] Received request to update app ${applicationId}`);
console.log(`📊 Current status: ${application.status}, New status: ${status}`);

// Check email sending:
console.log(`📧 Attempting to send email to: ${applicantEmail}`);
const emailResult = await sendApplicationStatusEmail({...});
console.log(`✅ Email sent result:`, emailResult);
```

### Browser DevTools Tips

1. **Network Tab**: Monitor API calls
   - Filter by XHR/Fetch
   - Check response status codes
   - Verify request/response payloads

2. **Console Tab**: Monitor JavaScript
   - Look for red errors
   - Check for warnings
   - Run custom debug commands

3. **Application Tab**: Check storage
   - LocalStorage for user token
   - SessionStorage for temporary data
   - Cookies for auth

4. **Performance**: Check loading time
   - Time to load Applications: should be <1s
   - Time to fetch scores: should be <3s total
   - Watch for 404 errors slowing things down

---

## 🚀 Quick Start Verification

```bash
# 1. Verify backend is running
curl http://localhost:5000/api/jobs/company/my-jobs

# 2. Check environment variables
echo "SMTP_HOST: $SMTP_HOST"
echo "FRONTEND_URL: $FRONTEND_URL"

# 3. Test API endpoints
# Get company jobs:
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/jobs/company/my-jobs

# Get application score:
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/ai/qualification-score/[APP_ID]

# Update status:
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shortlisted","note":"Great profile"}' \
  http://localhost:5000/api/applications/[APP_ID]/status
```

---

## 📝 Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden (status update) | Not company or wrong company | Verify logged in as company owner of job |
| 404 Application not found | Wrong application ID | Check application ID is valid and accessible |
| Email not sending | SMTP not configured | Set SMTP env vars or check config |
| Score shows 0% | Application not populated | Wait for backend to process, refresh page |
| Modal not visible | Z-index issue | Check for other modals with higher z-index |
| Buttons unclickable | pointer-events: none | Check CSS for pointer-events property |
| Form validation error | Missing required field | Fill in all fields marked with * |

---

## 📞 Support Information

If you continue to experience issues:

1. **Check the logs**: Look at server console output for errors
2. **Verify configuration**: Ensure all environment variables are set
3. **Test in isolation**: Use Postman/curl to test APIs directly
4. **Clear cache**: Hard refresh browser and clear cache
5. **Check browser compatibility**: Test in Chrome, Firefox, Safari

---

