# 🔐 Google OAuth Setup & Configuration Guide

## Overview

Google OAuth allows users to sign up/login using their Google account. The JobIFY platform supports Google Sign-In for both job seekers and companies.

---

## 🔧 Complete Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: `JobIFY`
5. Click "CREATE"
6. Wait for project to be created (may take 1-2 minutes)

### Step 2: Enable Google+ API

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Google+ API"
4. Click "ENABLE"
5. Wait for enablement to complete

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" at the top
3. Select "OAuth client ID"
4. If prompted, click "CONFIGURE CONSENT SCREEN" first:
   - User Type: External (for testing)
   - Click "CREATE"
   - Fill in:
     - **App name:** JobIFY
     - **User support email:** your-email@gmail.com
     - **Developer contact:** your-email@gmail.com
   - Click "SAVE AND CONTINUE"
   - Scopes: Click "ADD OR REMOVE SCOPES"
     - Search and add: `userinfo.email`, `userinfo.profile`
     - Click "UPDATE"
   - Click "SAVE AND CONTINUE"
   - Test users: Add your test email
   - Click "SAVE AND CONTINUE"

### Step 4: Create OAuth Client ID

After consent screen is configured:

1. Go back to "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `JobIFY Web Client`
5. Authorized JavaScript origins:
   ```
   http://localhost:5173
   http://localhost:3000
   https://jobify-rw.vercel.app
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   https://jobify-rw.vercel.app/auth/callback
   ```
7. Click "CREATE"
8. A dialog appears with your credentials:
   - **Client ID** - Copy this!
   - **Client Secret** - Copy this!

### Step 5: Save Credentials

The **Client ID** looks like:
```
618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com
```

Store it safely - you'll use it for:
- Backend: `GOOGLE_CLIENT_ID` environment variable
- Frontend: `VITE_GOOGLE_CLIENT_ID` environment variable

---

## 🔌 Environment Configuration

### Backend Configuration

Update `.env` in `backend-system/`:

```dotenv
# Google OAuth
GOOGLE_CLIENT_ID=618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com
```

### Frontend Configuration

Update `.env` in `frontend-system/`:

```dotenv
# Google OAuth (same Client ID as backend)
VITE_GOOGLE_CLIENT_ID=618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com
```

Both must use the **same Client ID**.

---

## 🧪 Testing Google Sign-Up

### Test 1: Local Development

1. **Restart backend:**
   ```bash
   cd backend-system
   npm run dev
   ```
   Check logs for:
   ```
   ✅ Email service initialized...
   🔐 Server running on port 5000
   ```

2. **Restart frontend:**
   ```bash
   cd frontend-system
   npm run dev
   ```
   Check for no errors in browser console

3. **Test Google Sign-In:**
   - Open `http://localhost:5173`
   - Go to "Sign Up"
   - Click "Sign up with Google"
   - Select your Google account
   - You should see a popup to sign in
   - After signing in, you should be redirected to dashboard

4. **Check Backend Logs:**
   ```
   🔐 Attempting Google OAuth verification...
   📋 Client ID configured: Yes
   ✅ Google OAuth verified for: your-email@gmail.com
   📝 New user created via Google OAuth: your-email@gmail.com
   ✅ Google login successful: your-email@gmail.com
   ```

5. **Check Frontend:**
   - Should be redirected to `/dashboard`
   - Your profile should show your Google name
   - Welcome email should arrive in inbox

### Test 2: Troubleshoot Google Sign-Up

If Google sign-up fails, check:

1. **Browser Console (F12):**
   - Look for error messages
   - Common errors:
     - "VITE_GOOGLE_CLIENT_ID is not configured"
     - "Google token verification failed"

2. **Backend Logs:**
   - Look for "Google login error" messages
   - Check if client ID is being recognized

3. **Verify Configuration:**
   ```bash
   # Check backend has client ID
   echo $GOOGLE_CLIENT_ID
   
   # Check frontend env
   cat frontend-system/.env | grep GOOGLE
   ```

---

## 🚀 Production Deployment

### Update Google Console Configuration

Before deploying to production:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Go to "APIs & Services" → "Credentials"
3. Click your OAuth 2.0 Client ID
4. Update "Authorized JavaScript origins":
   ```
   https://jobify-rw.vercel.app
   https://your-domain.com
   ```
5. Update "Authorized redirect URIs":
   ```
   https://jobify-rw.vercel.app/auth/callback
   https://jobify-rw.vercel.app
   https://your-domain.com/auth/callback
   ```
6. Click "SAVE"

### Set Environment Variables

On Render/Vercel Dashboard:

**Backend (Render):**
- Go to Environment Variables
- Add: `GOOGLE_CLIENT_ID=your-client-id`

**Frontend (Vercel):**
- Go to Settings → Environment Variables
- Add: `VITE_GOOGLE_CLIENT_ID=your-client-id`

### Deploy

```bash
git add .env
git commit -m "Update Google OAuth configuration for production"
git push origin main
```

---

## 🔗 Google Sign-Up Flow in Code

### Frontend Flow (Register.jsx)

```javascript
// 1. Load Google SDK
<script src="https://accounts.google.com/gsi/client"></script>

// 2. Initialize button with client ID
window.google.accounts.id.initialize({
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  callback: handleGoogleSuccess
});

// 3. Render button
window.google.accounts.id.renderButton(buttonRef);

// 4. Handle success - send token to backend
const handleGoogleSuccess = async (response) => {
  const res = await api.post('/auth/google-login', {
    token: response.credential
  });
  // Store token and redirect
};
```

### Backend Flow (auth.js)

```javascript
// 1. Receive token from frontend
router.post('/google-login', async (req, res) => {
  const { token } = req.body;

  // 2. Verify token with Google
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: token
  });

  // 3. Extract user data
  const payload = ticket.getPayload();
  const { sub, email, given_name, family_name, picture } = payload;

  // 4. Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      googleId: sub,
      userType: 'jobseeker',
      profile: {
        firstName: given_name,
        lastName: family_name,
        avatar: picture
      },
      password: crypto.randomBytes(32).toString('hex')
    });
    await user.save();
  }

  // 5. Generate JWT and return
  const authToken = generateToken(user._id);
  res.json({ token: authToken, user });
});
```

---

## 🐛 Troubleshooting Google OAuth

### Issue 1: "VITE_GOOGLE_CLIENT_ID is not configured"

**Problem:** Frontend shows error about missing Google Client ID

**Solution:**
1. Check `.env` in `frontend-system/`:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id
   ```
2. Restart frontend: `npm run dev`
3. Hard refresh browser: `Ctrl+Shift+R`

### Issue 2: "Invalid Client ID" or "Token audience mismatch"

**Problem:** Backend shows:
```
❌ Google token verification failed: audience mismatch
```

**Solution:**
1. Verify Client ID matches between frontend and backend
2. Check Google Console has correct authorized URIs:
   - For localhost: `http://localhost:5173`
   - For production: `https://jobify-rw.vercel.app`
3. Regenerate Client ID if necessary:
   - Go to Google Cloud Console
   - Delete old credential
   - Create new OAuth 2.0 Client ID
   - Update both frontend and backend

### Issue 3: "Google token has expired"

**Problem:** Backend shows:
```
❌ Google token verification failed: token expired
```

**Solution:**
1. This is a temporary error
2. Ask user to try signing in again
3. Ensure system clock is correct (server time sync)

### Issue 4: Google button doesn't render

**Problem:** No Google sign-in button appears on page

**Solution:**
1. Check browser console for JavaScript errors
2. Verify Google SDK script loaded:
   - Open DevTools → Network tab
   - Look for `gsi/client` script
   - Should show 200 status (loaded)
3. Check `googleButtonRef` is properly mounted
4. Verify `VITE_GOOGLE_CLIENT_ID` is set

### Issue 5: "Popup closed by user"

**Problem:** User closes Google sign-in popup without completing

**Solution:**
1. This is expected behavior
2. User can click button again to retry
3. No error needs to be shown

---

## 📊 User Creation from Google

When a user signs up with Google:

1. **Email verified** - Google verifies email ownership
2. **User account created** - Default type: "jobseeker"
3. **Welcome email sent** - Uses email service
4. **JWT token issued** - User logged in automatically
5. **Profile created** - With Google name and avatar
6. **Password generated** - Random, secure, user won't need it

User can later:
- Change user type (to company)
- Update profile information
- Set a custom password (password reset flow)

---

## 🔄 Google Sign-In vs Sign-Up

**Same Endpoint:**
- Both use: `POST /api/auth/google-login`
- If user exists: Returns JWT token (login)
- If user new: Creates account then returns JWT token (sign-up)

**Automatic Account Creation:**
- No separate "sign-up" flow needed
- First-time Google sign-in creates account
- Subsequent sign-ins just authenticate

---

## ✅ Verification Checklist

Before launching Google OAuth:

- [ ] Google Cloud Project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID copied to backend `.env`
- [ ] Client ID copied to frontend `.env`
- [ ] Both match exactly (check for typos)
- [ ] Test sign-up on localhost works
- [ ] Welcome email received
- [ ] User profile shows Google name/avatar
- [ ] Google Console has correct authorized URIs
- [ ] Production URLs added to Google Console
- [ ] Environment variables set on deployment platform

---

## 🆘 Need Help?

1. **Check Google OAuth Documentation:**
   - [Google Identity Documentation](https://developers.google.com/identity)
   - [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)

2. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for error messages

3. **Check Backend Logs:**
   - Look for "Google" related messages
   - Check for token verification errors

4. **Verify Configuration:**
   - Google Console authorized URIs
   - Environment variables on server
   - Client ID in both frontend and backend

---

**Google OAuth provides a smooth sign-up experience. Test thoroughly before production!**
