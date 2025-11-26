# Render Environment Variables Setup

This guide walks you through adding all required environment variables to your Render backend deployment.

## Steps to Add Environment Variables in Render Dashboard

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service**: `job-matching-platform-zvzw` (or your backend service name)
3. **Click on "Environment"** in the left sidebar
4. **Add each variable** by clicking "+ Add Environment Variable"

## Environment Variables to Add

Copy and paste each of these key-value pairs into Render:

### Database
```
MONGODB_URI: mongodb+srv://jobmatch_user:Password123@databasesystem.3yqcfvl.mongodb.net/?appName=databaseSystem
```

### JWT Security
```
JWT_SECRET: my_super_secured_key@2025
```

### Cloudinary (Image Uploads)
```
CLOUDINARY_CLOUD_NAME: dttuqxudh
CLOUDINARY_API_KEY: 736517535533693
CLOUDINARY_API_SECRET: 17nG8ewdM9vQ7FHlg6ALV7DBzho
```

### SMTP Email Configuration
```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_SECURE: false
SMTP_USER: jobifyrwanda@gmail.com
SMTP_PASS: qbraxrpkctfykagq
SMTP_FROM: JobIFY <jobifyrwanda@gmail.com>
ADMIN_ALERT_EMAIL: admin@jobify.com
```

### Google OAuth
```
GOOGLE_CLIENT_ID: 618539107494-1g19jfnogko0j5kog8fdklp48b68mk1j.apps.googleusercontent.com
```

### Frontend URL (CRITICAL for CORS)
```
FRONTEND_URL: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app
```

### Production Settings
```
NODE_ENV: production
```

## Quick Reference Table

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

## After Adding Variables

Once you've added all variables in Render:
1. **Save changes** (Render will prompt you)
2. The service will **automatically redeploy**
3. **Check the health endpoint**: https://job-matching-platform-zvzw.onrender.com/api/health
4. **Test from frontend**: https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app

## Verification

After deployment, verify CORS is working:
- Open browser DevTools (F12)
- Go to the frontend app
- Check Network tab for API calls
- You should see successful requests to the backend (no CORS errors)

## Troubleshooting

If you see "Not allowed by CORS" errors:
1. Verify `FRONTEND_URL` is exactly: `https://jobify-9gwmxxw9q-ai-ngabos-projects.vercel.app`
2. Check that all variables are saved (they should show as "***" in the dashboard)
3. Wait a few minutes for Render to fully redeploy
4. Check backend logs in Render dashboard for any errors

## Important Notes

- **Never commit `.env`** to version control (it's in `.gitignore`)
- **Always use the Render dashboard** to manage production environment variables
- **Keep credentials secure** - rotate `JWT_SECRET` and `SMTP_PASS` regularly in production
- **Update `FRONTEND_URL`** if you change your frontend domain
