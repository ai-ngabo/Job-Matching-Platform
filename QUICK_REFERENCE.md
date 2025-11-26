# 🚀 JobIFY Deployment - Quick Reference Card

## 🎯 What's Working Right Now

✅ **Backend Server**: https://job-matching-platform-zvzw.onrender.com
- Health check: https://job-matching-platform-zvzw.onrender.com/api/health
- Database: Connected to MongoDB Atlas
- Status: Running on port 5000

✅ **Frontend App**: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
- Framework: React + Vite
- Deployment: Vercel
- Status: Live and serving requests

## ⚠️ Current Action Required

### Step 1: Set Environment Variables in Render Dashboard (CRITICAL)

1. Go to: https://dashboard.render.com
2. Select: `job-matching-platform-zvzw`
3. Click: **Environment** in left sidebar
4. Add each variable:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://jobmatch_user:Password123@databasesystem.3yqcfvl.mongodb.net/?appName=databaseSystem` |
| `JWT_SECRET` | `my_super_secured_key@2025` |
| `CLOUDINARY_CLOUD_NAME` | `dttuqxudh` |
| `CLOUDINARY_API_KEY` | `736517535533693` |
| `CLOUDINARY_API_SECRET` | `17nG8ewdM9vQ7FHlg6ALV7DBzho` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `jobifyrwanda@gmail.com` |
| `SMTP_PASS` | `qbraxrpkctfykagq` |
| `SMTP_FROM` | `JobIFY <jobifyrwanda@gmail.com>` |
| `ADMIN_ALERT_EMAIL` | `admin@jobify.com` |
| `GOOGLE_CLIENT_ID` | `618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com` |
| `FRONTEND_URL` | `https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app` |
| `NODE_ENV` | `production` |

5. Save (Render will auto-redeploy in ~5 minutes)

### Step 2: Test After Deployment

Once Render redeploys:

```bash
# 1. Check backend is running
curl https://job-matching-platform-zvzw.onrender.com/api/health

# 2. Check CORS is working
curl -H "Origin: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app" \
     https://job-matching-platform-zvzw.onrender.com/api/health
```

### Step 3: Test Full App

1. **Open frontend**: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
2. **Open DevTools**: F12 → Console
3. **Look for**: "🔗 Connecting to backend at: https://..."
4. **Try to register**: Test@user@example.com / Test@123456
5. **Check Network tab**: API calls should be 200/201 (not CORS errors)

## 🔧 Common Commands

### View Render Logs
```
1. Go: https://dashboard.render.com
2. Select: job-matching-platform-zvzw
3. Click: Logs (top right)
4. Look for errors or "Server running on port 5000"
```

### View Frontend Logs
```
1. Open app: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
2. Press: F12
3. Go to: Console tab
4. Look for: API connection logs or errors
```

### Redeploy Backend on Render
```
1. Go: https://dashboard.render.com
2. Select: job-matching-platform-zvzw
3. Click: "Manual Deploy" or "Reboot"
4. Wait 3-5 minutes
```

### Redeploy Frontend on Vercel
```
1. Go: https://vercel.com/ai-ngabos-projects
2. Select: jobify-rw
3. Click: "Redeploy" button
4. Wait 1-2 minutes
```

## 📱 Features to Test

### User Registration
```
✓ Try registering as Job Seeker
✓ Try registering as Company
✓ Check for validation errors
✓ Verify email notification (if SMTP works)
```

### User Login
```
✓ Login with registered account
✓ Check token stored in localStorage
✓ Verify redirect to dashboard
```

### Job Posting (Company)
```
✓ Post a new job
✓ Fill in all required fields
✓ Submit job posting
✓ See job in listings
```

### Job Browsing
```
✓ View all jobs
✓ Search/filter jobs
✓ Sort by date/salary
✓ Apply to job (if Job Seeker)
```

### Profile Management
```
✓ Edit profile
✓ Upload profile photo
✓ Update bio/skills
✓ Save changes successfully
```

## 🐛 Troubleshooting

### "CORS error" in browser
- [ ] Render env vars added? (Check dashboard)
- [ ] Render redeployed? (Check 5 min after adding env vars)
- [ ] `FRONTEND_URL` correct? (Should be exact match)
- [ ] Check Render logs for CORS rejection

### "Cannot connect to backend"
- [ ] Backend running? Test: curl https://job-matching-platform-zvzw.onrender.com/api/health
- [ ] `VITE_API_BASE_URL` set in Vercel? (Check Vercel dashboard)
- [ ] Network tab showing what error? (Check DevTools)

### "Database connection failed"
- [ ] `MONGODB_URI` set in Render env vars?
- [ ] MongoDB Atlas whitelist includes Render? (Check Network Access)
- [ ] Check Render logs for connection errors

### "401 Unauthorized"
- Normal if not logged in
- [ ] Check localStorage.authToken in DevTools
- [ ] Token should be set after successful login
- [ ] If persists, check backend auth routes

## 📞 Resources

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **GitHub Repo**: https://github.com/ai-ngabo/Job-Matching-Platform

## 📚 Documentation

See these files in the repo for more info:
- `RENDER_ENV_SETUP.md` - Detailed env var setup
- `FULL_STACK_TEST.md` - Complete testing guide
- `DEPLOYMENT_STATUS.md` - Current deployment status
- `DEPLOYMENT_CHECKLIST.md` - Pre-deploy checklist

---

**Last Updated**: November 26, 2025
**Status**: 🟡 Awaiting Render env var configuration
**Frontend**: 🟢 Ready
**Backend**: 🟢 Ready (waiting for env vars)
