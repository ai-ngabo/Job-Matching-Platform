# Google Sign-In Setup Guide

## ⚠️ Critical: Fix "Origin not allowed" Error

The error `[GSI_LOGGER]: The given origin is not allowed for the given client ID` means your domain is not registered in Google Cloud Console.

## Step-by-Step Setup

### 1. Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project (or create a new one)
3. Navigate to: **APIs & Services** → **Credentials**

### 2. Find Your OAuth 2.0 Client ID

1. Look for: `618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com`
2. Click on it to edit

### 3. Add Authorized JavaScript Origins

Click **"+ ADD URI"** and add these origins:

**For Development:**
```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
```

**For Production:**
```
https://jobify-rw.vercel.app
https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
```

### 4. Add Authorized Redirect URIs

Click **"+ ADD URI"** and add:

**For Development:**
```
http://localhost:5173
http://localhost:3000
```

**For Production:**
```
https://jobify-rw.vercel.app
https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
```

### 5. Save Changes

- Click **"SAVE"** at the bottom
- Wait 1-2 minutes for changes to propagate

### 6. Verify Environment Variables

**Backend (.env or Render):**
```env
GOOGLE_CLIENT_ID=618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com
```

**Frontend (.env or Vercel):**
```env
VITE_GOOGLE_CLIENT_ID=618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com
```

### 7. Test

1. Clear browser cache
2. Restart your development server
3. Try Google Sign-In again

## Troubleshooting

### Still Getting 401 Error?

1. **Check Backend Logs:**
   - Look for: `❌ Google token verification failed`
   - Check if `GOOGLE_CLIENT_ID` is set correctly

2. **Verify Client ID:**
   ```bash
   # In backend, check if env var is loaded
   console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
   ```

3. **Check Token:**
   - Open browser DevTools → Network tab
   - Look for `/api/auth/google-login` request
   - Check if token is being sent

### Still Getting 403 Error?

1. **Wait 5-10 minutes** after adding origins (Google needs time to propagate)
2. **Clear browser cache** completely
3. **Try incognito/private window**
4. **Check if origin matches exactly** (no trailing slashes, correct protocol)

### Button Not Showing?

1. Check browser console for errors
2. Verify `VITE_GOOGLE_CLIENT_ID` is set in frontend
3. Check if Google SDK script loads: Look for `https://accounts.google.com/gsi/client` in Network tab

## Quick Checklist

- [ ] Added `http://localhost:5173` to Authorized JavaScript Origins
- [ ] Added production URLs to Authorized JavaScript Origins
- [ ] Added redirect URIs
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 2-5 minutes for propagation
- [ ] Set `GOOGLE_CLIENT_ID` in backend environment
- [ ] Set `VITE_GOOGLE_CLIENT_ID` in frontend environment
- [ ] Cleared browser cache
- [ ] Restarted development servers

## Need Help?

If issues persist:
1. Check backend logs for detailed error messages
2. Check browser console for JavaScript errors
3. Verify all environment variables are set correctly
4. Ensure you're using the correct Client ID (not Client Secret)

