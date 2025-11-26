# Full-Stack Integration Test Guide

## Quick Verification Steps

### 1. **Check Backend Health** ✅
```
Open in browser: https://job-matching-platform-zvzw.onrender.com/api/health
Expected response:
{
  "message": "JobIFY Backend is running!",
  "timestamp": "...",
  "database": "Connected"
}
```

### 2. **Check Frontend Loads** ✅
```
Open in browser: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
Expected: App loads without errors
```

### 3. **Verify Console Logs** (F12 DevTools)
```
Open: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
Press: F12 to open Developer Tools
Go to: Console tab
Look for:
  ✅ "🔗 Connecting to backend at: https://job-matching-platform-zvzw.onrender.com/api"
  ✅ No CORS errors
  ✅ No 401/403 errors
```

### 4. **Test User Registration** 
```
1. Click "Sign Up" or "Register"
2. Fill in the form:
   - Email: testuser@example.com
   - Password: Test@123456
   - Role: Job Seeker (or Company)
3. Click "Register"
4. Expected:
   ✅ Redirect to dashboard or verification page
   ❌ No CORS error
   ❌ No "Cannot POST /api/auth/register" error
```

### 5. **Test User Login**
```
1. Click "Login"
2. Enter registered email and password
3. Click "Sign In"
4. Expected:
   ✅ Redirect to dashboard
   ✅ Profile/user info displays
   ❌ No CORS errors
```

### 6. **Test API Call via Network Tab**
```
1. Open DevTools (F12)
2. Go to: Network tab
3. Perform any action (login, register, browse jobs)
4. Look for network requests to:
   https://job-matching-platform-zvzw.onrender.com/api/*
5. Expected:
   ✅ Status: 200/201/etc (success codes)
   ❌ Status: 0 or 'CORS error'
   ❌ Status: 401 (unless logged out)
```

### 7. **Test Job Posting (Company)**
```
If logged in as Company:
1. Go to: Dashboard → Post Job (or similar)
2. Fill job form
3. Click "Post"
4. Expected:
   ✅ Job appears in list
   ✅ No error messages
   ❌ No "cannot connect to backend" errors
```

### 8. **Test Job Application (Job Seeker)**
```
If logged in as Job Seeker:
1. Browse job listings
2. Click "Apply" on a job
3. Fill application form
4. Click "Submit"
5. Expected:
   ✅ Confirmation message
   ✅ Application appears in "My Applications"
   ❌ No API errors
```

## Troubleshooting

### **CORS Error: "No 'Access-Control-Allow-Origin' header"**
- [ ] Backend environment variables set in Render dashboard
- [ ] `FRONTEND_URL` = `https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app`
- [ ] Render service redeployed after env vars added
- [ ] Check Render logs for CORS rejection messages

### **401 Unauthorized**
- [ ] Normal if not logged in
- [ ] If persists after login, check token in localStorage:
  - Open DevTools → Application → Local Storage → authToken
  - Token should exist after login

### **Frontend shows "Cannot connect to backend"**
- [ ] Check frontend env variables in Vercel:
  - `VITE_API_BASE_URL` = `https://job-matching-platform-zvzw.onrender.com/api`
  - `VITE_GOOGLE_CLIENT_ID` = Google OAuth ID
- [ ] Verify backend is running: https://job-matching-platform-zvzw.onrender.com/api/health
- [ ] Check Network tab for failed requests

### **Database Connection Issues**
- [ ] Check Render env: `MONGODB_URI` is set correctly
- [ ] MongoDB Atlas whitelist includes Render IP (0.0.0.0/0 or Render's IP)
- [ ] Check Render logs for connection errors

## Real-Time Logs

### View Backend Logs (Render)
```
1. Open: https://dashboard.render.com
2. Select: job-matching-platform-zvzw
3. Go to: Logs
4. Look for:
   ✅ "Server running on port 5000"
   ✅ "MongoDB connected successfully"
   ✅ "🚀 JobIFY Backend Started"
   ⚠️ CORS errors if frontend can't connect
```

### View Frontend Logs (Vercel)
```
1. Open: https://vercel.com
2. Select: jobify-rw project
3. Go to: Deployments → Last deployment → Logs
4. Or in browser DevTools Console (F12)
```

## Performance Baseline

Typical response times (after infrastructure warmup):
- **Health check**: < 100ms
- **Login**: < 500ms
- **Job listing**: < 1000ms
- **Image upload**: < 2000ms (depends on file size)

## Success Indicators

✅ **All systems are working if:**
- Backend health endpoint returns Connected database
- Frontend app loads without JavaScript errors
- Console shows "🔗 Connecting to backend at: https://..."
- Network requests go to backend API without CORS errors
- Can login and see profile data
- Can post jobs / apply to jobs

❌ **Issues to address if:**
- CORS errors in browser console
- Backend returns 500 errors
- Cannot find backend at specified URL
- Database shows "Disconnected"
- 401 errors persist after successful login
