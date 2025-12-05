# Admin Health Token - Explained

## What is it?

The **Admin Health Token** (`ADMIN_HEALTH_TOKEN`) is a **secret password** that protects sensitive admin endpoints from being accessed by unauthorized users. It's like a master key for administrators.

## Why do we need it?

Without it, anyone could:
- View all queued emails (including private user information)
- Resend emails
- Delete emails from the retry queue
- Check email service health

The token ensures only authorized admins can do these things.

## Where is it used?

The token is required for these admin endpoints:

1. **GET `/api/email-queue`** - View list of queued emails
2. **POST `/api/email-queue/:id/resend`** - Resend a queued email
3. **DELETE `/api/email-queue/:id`** - Delete a queued email
4. **GET `/api/email-health`** - Check if email service is working

All requests to these endpoints must include the token in the header: `x-admin-token: YOUR_TOKEN_VALUE`

## How to Create One

You can use ANY string you want. Here are some examples:

### Option 1: Simple String
```
my-secret-admin-key-12345
```

### Option 2: UUID (Recommended)
```
550e8400-e29b-41d4-a716-446655440000
```

### Option 3: Random Token Format
```
admin_xyz123def456ghi789jkl012mno345pqr
```

**Recommendation**: Use a strong, random token. Something like:
```
admin_secret_token_xyz789_jobify_2025
```

## How to Set It Up on Render

### Step 1: Generate a Token
Come up with a strong secret string (or copy one of the examples above).

Example: `admin_token_xyz123_jobify_secure`

### Step 2: Add to Render Environment Variables
1. Go to your Render dashboard
2. Navigate to your backend service
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Enter:
   - **Key**: `ADMIN_HEALTH_TOKEN`
   - **Value**: Your token (e.g., `admin_token_xyz123_jobify_secure`)
6. Click **"Save"**
7. Render will **automatically redeploy** your service

### Step 3: Use It in the Admin Dashboard
1. Login to your app as admin
2. Go to `/admin` dashboard
3. Click the **"Emails"** tab
4. In the token input field, paste: `admin_token_xyz123_jobify_secure`
5. Click **"Set token"**
6. Now you can see and manage queued emails!

## How It Works (Technical)

### In the Backend (Node.js):
```javascript
// Server checks if the token matches
const ADMIN_HEALTH_TOKEN = process.env.ADMIN_HEALTH_TOKEN || '';

router.get('/', (req, res) => {
  const token = req.headers['x-admin-token']; // Get token from request header
  
  if (!token || token !== ADMIN_HEALTH_TOKEN) {
    return res.status(403).json({ message: 'Forbidden' }); // Reject if wrong
  }
  
  // Token is valid, proceed with the request
});
```

### In the Frontend (React):
```javascript
// Admin dashboard sends the token with each request
const response = await api.get('/email-queue', {
  headers: { 'x-admin-token': adminToken }
});
```

## Storage

- **On Render**: Stored as an environment variable (secure, encrypted)
- **In Browser**: Stored in localStorage under key `adminToken` (so admin doesn't need to paste it every visit)
- **In Transit**: Sent in HTTP request header (encrypted if using HTTPS, which Render uses)

## Security Notes

✅ **Good Practices:**
- Use a long, random string (20+ characters)
- Don't share it with non-admins
- Change it periodically if you suspect it was compromised
- Use HTTPS (Render does this automatically)

❌ **Don't Do:**
- Don't use simple words like "password" or "admin123"
- Don't commit it to GitHub (it's in Render env vars, not in code)
- Don't share it in chat or emails
- Don't use the same token as your database password

## What If I Lose It?

No problem! You can always:
1. Login to Render dashboard
2. Go to your backend service → Environment
3. Find `ADMIN_HEALTH_TOKEN`
4. Click **Edit** and change it to a new value
5. The browser localStorage will still have the old value, so:
   - Click **"Clear"** button in the Emails admin panel, or
   - Click the **"Clear"** button or manually clear localStorage
   - Paste the new token

## Example Setup Scenario

```
Step 1: Generate Token
  Token: "job_admin_2025_secret_xyz789"

Step 2: Add to Render
  ADMIN_HEALTH_TOKEN = "job_admin_2025_secret_xyz789"
  (Service redeploys)

Step 3: Use in Admin Dashboard
  Paste "job_admin_2025_secret_xyz789" into the Emails tab
  Click "Set token"
  ✅ Now you can see queued emails!
```

## Testing Your Token

You can verify your token works using curl (from terminal):

```bash
# Replace YOUR_TOKEN with your actual token value
# Replace YOUR_RENDER_URL with your Render backend URL

curl -H "x-admin-token: YOUR_TOKEN" \
  https://your-render-backend.onrender.com/api/email-queue

# If token is correct, you'll see:
# {"ok":true,"total":0,"items":[]}

# If token is wrong, you'll see:
# {"message":"Forbidden - invalid token"}
```

## Still Confused?

Think of it like this:

- **Regular user**: Can apply for jobs, view applications
- **Company user**: Can post jobs, manage applications
- **Admin user**: Can manage all users and companies
- **Admin with token**: Can ALSO view/manage the email system

The token is the "key" that unlocks the email management features.

## Quick Checklist

Before you finish setup:

- [ ] I've generated a strong token string
- [ ] I've added `ADMIN_HEALTH_TOKEN` to Render environment variables
- [ ] I've pasted the token into the Emails admin panel
- [ ] I clicked "Set token" button
- [ ] The token is saved in browser localStorage
- [ ] I can see the email queue (or "No queued emails" message)
- [ ] The "Check Email Health" button works

## Need Help?

If you're stuck:

1. **Token not working**: Make sure you copied it exactly (no spaces before/after)
2. **Can't find Render env vars**: Look for "Environment" tab in your service settings
3. **Token deleted by accident**: You can always set a new one in Render and update in browser
4. **Forgot what token I set**: Check Render dashboard → Environment tab (it will show `***` for security)

---

**Now generate your token and add it to Render. Your email management system will be ready to go!** ✅
