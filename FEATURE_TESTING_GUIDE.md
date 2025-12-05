# Feature Testing Guide — Job Matching Platform

**Date**: December 5, 2025  
**Status**: ✅ All features implemented and ready for testing

---

## Quick Start

### Access the Application
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:5000/api (Express dev server)

### Browser DevTools Recommendations
- Open **Console** (F12) to see debug logs and any errors
- Open **Network** tab to monitor API calls
- Recommended: Chrome, Firefox, Edge (latest versions)

---

## Feature Checklist

### 1. **Job Listings Page** (`/jobs`)
**Purpose**: Display all active job postings with per-job AI match scores, animated badges, and interactive breakdown.

#### ✅ Test Steps

1. **Login as Job Seeker**
   - Navigate to `/login` or click "Sign In"
   - Use a test jobseeker account (or create one)
   - Verify token is stored in localStorage and Authorization header is sent

2. **View Job Listings**
   - Go to `/jobs`
   - You should see a grid of job cards with:
     - **Card Header**: Company logo (left), Save bookmark button (right)
     - **Card Body**: Job title, company name, location/salary stats
     - **Meta Tags**: Job type (e.g., "full-time"), category (e.g., "technology")
     - **Match Badge** (top-right, floating): Animated percentage (e.g., "45% Match")
       - Badge animates from 0 → final score over ~800ms
       - Each job shows a **different** match score (this is per-job matching)
     - **Action Buttons**: "View Details" (primary), "Apply" (secondary)
   - **Expected**: At least 5–10 jobs should display, each with a different match percentage

3. **Test Multi-Field Search**
   - Search bar placeholder says: "Search: job title, company, skills, location, field, salary..."
   - Type a job title (e.g., "Engineer") → results filter to matching titles
   - Type a company name (e.g., "Google") → results show only that company's jobs
   - Type a skill (e.g., "Python") → results show jobs requiring that skill
   - Type a location (e.g., "Kigali") → results show jobs in that location
   - **Expected**: Search works across all fields, no lag

4. **Test Filter Dropdowns**
   - Select "Job Type" → filter by "full-time", "remote", "internship", etc.
   - Select "Category" → filter by "technology", "design", "healthcare", etc.
   - **Expected**: Filters apply immediately, card count updates

5. **Test Animated Match Badge**
   - Look at any job card with a match percentage (e.g., "67% Match")
   - Watch the number animate upward when the page loads (should take ~800ms)
   - **Expected**: Badge smoothly animates, not instant; no jank or layout shift

6. **Test Interactive Match Badge Breakdown**
   - Click on the animated match badge (e.g., "67% Match")
   - A popover should appear showing:
     - **Profile**: XX% (progress bar)
     - **Skills**: XX% (progress bar)
     - **Education**: XX% (progress bar)
     - **Experience**: XX% (progress bar)
     - **Qualifications**: XX% (progress bar)
     - **Close button** (✕) in top-right of popover
   - Each progress bar shows 0–100 with smooth animation
   - Click the close button (✕) → popover closes
   - Click badge again → popover reopens (cached, fast)
   - **Expected**: Breakdown loads, displays cleanly, progress bars animate, can toggle

7. **Test Save/Bookmark Button**
   - Click the bookmark icon on a card header (outlined bookmark)
   - Icon should change to filled bookmark (✓ BookmarkCheck) and turn golden
   - Bookmark should persist in localStorage (check DevTools → Application → Local Storage → `savedJobs`)
   - Navigate away and back → saved status remains
   - Click again to unsave → icon reverts to outline
   - **Expected**: Save state persists, icon changes correctly

8. **Responsive Design (Desktop, Tablet, Mobile)**
   - Resize browser to tablet width (768px) or smaller
   - Cards should stack to 1 column
   - Search and filter controls should stack vertically
   - Match badge should still be visible top-right
   - Breakdown popover should reposition to stay visible
   - **Expected**: No broken layout, all text readable

9. **Empty/Error States**
   - Search for something that returns no results (e.g., "xyzabc123")
   - Should show: "No jobs found matching your criteria" with a "Clear Filters" button
   - Click "Clear Filters" → all jobs reappear
   - **Expected**: Graceful empty state, easy recovery

10. **Console Logs (Optional - for debugging)**
    - Open DevTools Console (F12)
    - You should see logs like:
      - `✅ Google SDK initialized successfully`
      - `💾 Toggling save for job: [jobId]`
      - `📢 Storage event dispatched`
    - No red error messages expected
    - **Expected**: Clean logs, no stack traces

---

### 2. **Job Details Page** (`/jobs/:jobId`)
**Purpose**: Show detailed job info with per-job AI match score and breakdown.

#### ✅ Test Steps

1. **Navigate to Job Details**
   - From `/jobs`, click "View Details" on any job card
   - URL should change to `/jobs/[jobId]` (e.g., `/jobs/507f1f77bcf86cd799439011`)

2. **View Match Score in Sidebar**
   - Look for an "AI Match Score" section (usually right sidebar or below description)
   - Should display the same match % as shown on the listing (consistency check)
   - Should show a breakdown or link to breakdown
   - **Expected**: Score and breakdown consistent with listing

3. **Test Save Job**
   - Click bookmark icon to save this job
   - Icon changes to filled golden bookmark
   - Navigate back to `/jobs` listing
   - Find this job in list and verify bookmark is filled
   - **Expected**: Save state consistent across pages

4. **Test Apply Button**
   - Click "Apply" or "Apply Now"
   - You should be taken to application form or external link
   - **Expected**: Apply flow initiates correctly

---

### 3. **Saved Jobs Page** (`/saved-jobs`)
**Purpose**: Display bookmarked jobs with match scores and ability to remove.

#### ✅ Test Steps

1. **Navigate to Saved Jobs**
   - From any page, go to `/saved-jobs` or click navbar link
   - You should see only jobs you've bookmarked

2. **Verify Header Styling**
   - Top header should have:
     - **Left**: BookmarkCheck icon + "Saved Jobs" title
     - **Right**: Badge showing count (e.g., "5 Saved")
   - Header background should be a dark indigo/purple gradient
   - **Text should be visible** (white text, good contrast)
   - **Expected**: Header is clean, readable, professional

3. **View Saved Job Cards**
   - Each card displays:
     - Company logo, remove (trash icon) button
     - Job title, company name
     - Location, salary, experience level, job type tags
     - Remove button in top-right corner
   - **Match badges** should be present on saved jobs (same animated style as listing)
   - **Expected**: Cards look polished, match badges visible

4. **Test Search in Saved Jobs**
   - Use search box at top: "Search by job title, company, or location..."
   - Type a job title → filters saved jobs
   - Results counter shows: "Found X of Y saved jobs"
   - **Expected**: Search filters correctly, counter updates

5. **Remove Saved Job**
   - Click trash icon on a saved job card
   - Card should disappear from list
   - Go back to `/jobs` listing, find that job, verify bookmark is now unfilled
   - **Expected**: Removal works bidirectionally (state syncs)

6. **Empty State**
   - If no saved jobs, should show a message: "No Saved Jobs Yet" with "Browse Jobs" button
   - Click button → navigate to `/jobs`
   - **Expected**: Graceful empty state and navigation

---

### 4. **Dashboard / Proficiency System** (`/dashboard` or `/jobs/manage`)
**Purpose**: Show user proficiency level and per-job matching insights.

#### ✅ Test Steps

1. **Navigate to Dashboard**
   - Go to `/dashboard` or `/jobs/manage`
   - You should see a **proficiency header** at the top

2. **Verify Proficiency Badge**
   - Look for a colored circle badge showing your proficiency level:
     - **Green (🟢 Expert)**: Score 80–100
     - **Amber (🟠 Advanced)**: Score 65–79
     - **Blue (🔵 Intermediate)**: Score 40–64
     - **Red (🔴 Beginner)**: Score <40
   - Badge displays level text (e.g., "Advanced")
   - **Expected**: Badge color matches score range

3. **View Match Breakdown**
   - Click "View Match Details" or expand breakdown section
   - Should show weights:
     - Profile Completeness: 30%
     - Skills: 20%
     - Education: 15%
     - Experience: 15%
     - Qualifications Match: 20%
   - **Expected**: Breakdown visible and adds up to 100%

4. **View Strengths and Improvement Areas**
   - Section showing "Strengths" (top 3–4 areas you excel in)
     - Example: "Python expertise", "Communication skills"
   - Section showing "Areas to Improve" (actionable suggestions)
     - Example: "Add a portfolio link to your profile"
   - **Expected**: Personalized suggestions, not generic

5. **Dashboard Stats**
   - Should show:
     - Overall AI Match Score (0–100)
     - Profile completion status
     - Recommended jobs count
   - **Expected**: Stats up-to-date and relevant

---

### 5. **Responsive Design & Mobile**
**Purpose**: Ensure all features work on small screens.

#### ✅ Test Steps

1. **Resize to Mobile (375px width)**
   - Open DevTools (F12) → Device Toolbar
   - Set to iPhone 12 or similar (375px width)
   - Navigate to `/jobs`

2. **Test Job Listings on Mobile**
   - Job cards should stack in single column
   - Match badge should still be visible (not hidden or overlapping text)
   - Search bar and filters should stack
   - Buttons should be full-width or stack vertically
   - **Expected**: Fully functional, no horizontal scroll, readable text

3. **Test Saved Jobs on Mobile**
   - Go to `/saved-jobs`
   - Header should be readable (possibly stack vertically on very small screens)
   - Cards should display in single column
   - Search and remove buttons should be easily tappable (>44px height recommended)
   - **Expected**: Mobile-friendly layout

4. **Test Dashboard on Mobile**
   - Go to `/dashboard`
   - Proficiency badge and breakdown should fit on screen
   - Strengths/improvements list should be scrollable if needed
   - **Expected**: Responsive, no broken layout

---

### 6. **Console & Network Monitoring**
**Purpose**: Verify API calls and performance.

#### ✅ Test Steps

1. **Open DevTools Network Tab**
   - F12 → Network tab
   - Refresh page
   - Look for these API calls:
     - `GET /api/jobs` → Returns array of jobs with `matchScore` for each
     - `GET /api/jobs/recommended` → Returns recommended jobs with scores
     - `GET /api/ai/match-score/:jobId` → Called when you click match badge (loads breakdown)

2. **Verify Response Payloads**
   - Click on `GET /api/jobs` in Network tab
   - In Response, check job objects include `matchScore` (numeric 0–100)
   - Each job should have a **different** matchScore
   - **Expected**: Per-job scores are returned, not just one global score

3. **Check Breakdown Fetch**
   - Go to `/jobs` and click a match badge
   - Watch Network tab
   - Should see `GET /api/ai/match-score/[jobId]` request
   - Response should include `matchBreakdown` or similar breakdown data
   - **Expected**: Breakdown fetched on-demand, not pre-loaded

4. **Monitor Performance**
   - Full page load time should be <3 seconds
   - Click match badge should show breakdown within <1 second
   - No 404 or 500 errors in Network tab
   - **Expected**: Responsive, no errors

---

### 7. **Cross-Browser & Local Storage**
**Purpose**: Ensure compatibility and state persistence.

#### ✅ Test Steps

1. **Test on Multiple Browsers**
   - Chrome: ✅ Should work
   - Firefox: ✅ Should work
   - Edge: ✅ Should work
   - Safari (if available): ✅ Should work

2. **Verify localStorage Persistence**
   - DevTools → Application → Local Storage → `http://localhost:5173`
   - Look for `savedJobs` key (array of job IDs)
   - Save/unsave a job and watch the key update
   - **Expected**: localStorage syncs with UI state

3. **Test Storage Event Dispatch**
   - Save a job on one page, then navigate
   - The saved state should persist (navbar badge updates)
   - Open two browser tabs with the platform
   - Save a job in tab A, watch tab B update (cross-tab sync)
   - **Expected**: Storage events trigger UI updates

---

## Expected Behavior Summary

| Feature | Expected Behavior |
|---------|-------------------|
| **Multi-field search** | Searches title, company, skills, location, category, salary simultaneously |
| **Per-job matching** | Each job shows a different match % based on your profile vs. job requirements |
| **Animated badge** | Match % animates from 0 → final value over ~800ms, easing-out cubic |
| **Breakdown popover** | Click badge → shows profile/skills/education/experience/qualifications with progress bars |
| **Save/bookmark** | Click to add/remove from localStorage, icon changes, state persists across pages |
| **Saved jobs page** | Shows only bookmarked jobs, searchable, removable, with match scores |
| **Dashboard proficiency** | Shows color-coded level (Beginner/Intermediate/Advanced/Expert) with strengths/improvements |
| **Responsive design** | Works on desktop, tablet, mobile without broken layout |
| **API integration** | Each job includes `matchScore` when authenticated as jobseeker |

---

## Troubleshooting

### Match badges not showing?
- Ensure you're logged in as a **jobseeker** (not company or public)
- Check Network tab: `GET /api/jobs` should return `matchScore` for each job
- Check browser Console for errors

### Breakdown popover not appearing?
- Ensure `/api/ai/match-score/:jobId` endpoint is working (check Network tab)
- Check if you have a valid auth token (localStorage `authToken`)
- Look for errors in console

### Saved jobs not persisting?
- Check DevTools → Application → Local Storage → `savedJobs` key exists
- Ensure localStorage is not disabled in browser
- Try clearing localStorage and re-saving: in Console, run `localStorage.removeItem('savedJobs'); location.reload();`

### Performance issues?
- Check Network tab for slow API responses
- Look for 429 (rate limit) or 500 (server error) responses
- Restart backend: `cd backend-system && npm run dev`

---

## Test Account Credentials (if available)
- **Jobseeker Email**: jobseeker@test.com
- **Password**: [check .env or backend docs]
- Or create a new account via signup

---

## What to Report
If you find issues, note:
1. **Steps to reproduce**
2. **Expected behavior** (from this guide)
3. **Actual behavior** (what you saw)
4. **Screenshot or console error**
5. **Browser & OS**

---

## Success Criteria ✅
- [ ] All 5 jobs visible on listings page with animated match badges
- [ ] Each job has a different match score
- [ ] Click badge → breakdown popover appears with progress bars
- [ ] Search filters across job title, company, skills, location
- [ ] Saved jobs persist across page navigation
- [ ] Dashboard shows proficiency level (color-coded badge)
- [ ] Responsive layout on mobile/tablet
- [ ] No errors in browser console
- [ ] API calls show per-job `matchScore` in responses

---

## Next Steps After Testing
1. **Document any bugs** found during testing
2. **Get user feedback** on UX (badge animations, breakdown clarity, match accuracy)
3. **Performance tuning** if API calls are slow
4. **Deployment preparation** (environment variables, production server setup)

---

**Happy testing! 🚀**
