# Production Email Delivery Setup (SendGrid recommended)

To keep email delivery reliable in production (avoids outbound SMTP port blocking on some hosts like Render), configure one of the following options in your Render (or host) environment variables.

## Option A — SendGrid (recommended)
- Create a SendGrid account and generate an API key (Mail Send permissions).
- In your Render service (or platform), add the environment variable:
  - `SENDGRID_API_KEY=<your_sendgrid_api_key>`

The backend now prefers SendGrid (HTTPS API) when `SENDGRID_API_KEY` is set. It will retry with exponential backoff on transient errors.

## Option B — Traditional SMTP (Gmail or other)
- If you prefer SMTP (Gmail), use an App Password (Gmail with 2FA) and set:
  - `SMTP_HOST` (e.g. `smtp.gmail.com`)
  - `SMTP_PORT` (587 or 465)
  - `SMTP_USER` (your-email@example.com)
  - `SMTP_PASS` (app password)
  - `SMTP_FROM` (optional, e.g. `JobIFY <no-reply@jobify.rw>`)

Note: Render and some hosts may block outbound SMTP ports. If you see `ETIMEDOUT` errors in logs when using SMTP, switch to SendGrid (or similar provider).

## Other helpful env vars
- `CONTACT_EMAIL` - where contact form messages are forwarded (default: `jobifyrwanda@gmail.com`)
- `ADMIN_ALERT_EMAIL` - admin notifications
- `TEST_EMAIL` - optional address used by quick test script

## Quick test (after setting env vars)
From the repository root (locally or via a run command on Render):

```powershell
cd backend-system; node scripts/test_send_email.js
```

This script attempts to forward a small contact-form-style message to `CONTACT_EMAIL` / `ADMIN_ALERT_EMAIL` and logs results. Check the application logs and the recipient inbox (or spam) for delivery.

## Troubleshooting
- If you see `Connection timeout` or `ETIMEDOUT` in Render logs: switch to an API-based provider (SendGrid, Mailgun, Postmark).
- Ensure SendGrid key is valid and has Mail Send permissions.
- For SMTP, verify port and app password, and ensure the hosting provider allows outbound SMTP.

## Summary
- Recommended: Configure `SENDGRID_API_KEY` on Render for robust, API-based email delivery.
- Fallback: SMTP is still supported if env vars are set, but may be blocked by hosting networks.
