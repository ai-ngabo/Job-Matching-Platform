# Admin Health Token - Setup in 3 Steps

## Step 1️⃣: Generate Your Token

Pick any strong secret string. Here's a quick generator:

**Option A - Simple (copy & use):**
```
admin_jobify_secret_2025_xyz
```

**Option B - Generate your own:**
- Go to https://www.uuidgenerator.net/
- Copy the UUID that appears
- Use it as your token

**Option C - Make one up:**
```
my_secret_admin_key_1234567890_abc
```

👉 **Pick one and copy it to your clipboard**

---

## Step 2️⃣: Add to Render

### On Render Dashboard:

1. Go to https://dashboard.render.com/
2. Select your **Job-Matching-Platform** backend service
3. Click the **"Environment"** tab
4. Click **"Add Environment Variable"** button
5. Fill in:
   - **Key:** `ADMIN_HEALTH_TOKEN`
   - **Value:** Paste your token from Step 1
6. Click **"Save"**
7. ⏳ Wait for Render to redeploy (2-5 minutes)

### After Redeployment:
- Go to **"Events"** tab and confirm deployment succeeded ✅
- Your backend now has the token configured

---

## Step 3️⃣: Use in Admin Dashboard

### In Your Jobify App:

1. **Login** as an admin user
2. **Go to** `/admin` (or click Admin Dashboard in navigation)
3. **Click the "Emails"** tab (new tab)
4. **Find the token input** at the top that says "Admin token:"
5. **Paste** your token from Step 1
6. **Click "Set token"** button
7. ✅ **Done!** You should now see:
   - A table of queued emails (if any exist), OR
   - "No queued emails" message (if queue is empty)

### Now You Can:
- 📧 **View** all queued emails
- 🔄 **Resend** any failed email
- 🗑️ **Delete** emails from the queue
- ❤️ **Check Email Health** (verify SendGrid or SMTP is working)

---

## 🎯 Quick Reference

| What | Where | Value |
|------|-------|-------|
| **Set Token** | Render → Environment | Your secret string |
| **Use Token** | Admin Dashboard → Emails tab | Same secret string |
| **Storage** | Browser | localStorage (saved automatically) |
| **Duration** | Permanent | Until you clear browser data |

---

## ❓ Common Questions

**Q: What token should I use?**
A: Anything strong and random. Example: `super_secret_token_xyz789_jobify`

**Q: Can I change it later?**
A: Yes! Go to Render Environment tab, edit the value, save, and redeploy.

**Q: What if I forget it?**
A: You can see `ADMIN_HEALTH_TOKEN` value in Render Environment tab (though it will show `***` for security). You can also just set a new one.

**Q: Is my token secure?**
A: Yes! It's:
- Encrypted on Render servers
- Only sent over HTTPS
- Only stored in browser localStorage
- Never sent to GitHub

**Q: Do I need to share it with other admins?**
A: Yes, other admins need the same token to access the email queue. Only share with trusted admins.

---

## 🚀 You're Ready!

Once you complete all 3 steps:
- ✅ Backend has the token in environment
- ✅ Admin dashboard has the token saved
- ✅ Email queue management is fully operational

**Estimated time: 5-10 minutes**

---

**Next steps:**
1. Generate your token ⬅️
2. Add to Render environment
3. Use in admin dashboard
4. Start managing emails! 📧
