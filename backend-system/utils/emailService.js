import nodemailer from 'nodemailer';

let transporter = null;
let isInitialized = false;

const getFromAddress = () => process.env.SMTP_FROM || 'JobIFY <no-reply@jobify.rw>';
const getAdminAlertEmail = () => process.env.ADMIN_ALERT_EMAIL || '';

const initializeEmailService = () => {
  if (isInitialized) return transporter;

  const isEmailConfigured =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  if (isEmailConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure:
        process.env.SMTP_SECURE === 'true' ||
        Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    transporter.verify()
      .then(() => {
        console.log('✅ Email service configured and verified successfully');
        console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
        console.log(`📧 From Address: ${getFromAddress()}`);
      })
      .catch((err) => {
        console.warn('⚠️ SMTP transporter verification failed:', err.message);
        console.warn('⚠️ Email sending may not work. Please check your SMTP credentials.');
      });
  } else {
    console.warn(
      '⚠️ Email service not fully configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable transactional emails.'
    );
    console.warn('📋 Current env check:', {
      SMTP_HOST: process.env.SMTP_HOST ? '✓ Set' : '✗ Missing',
      SMTP_USER: process.env.SMTP_USER ? '✓ Set' : '✗ Missing',
      SMTP_PASS: process.env.SMTP_PASS ? '✓ Set' : '✗ Missing'
    });
  }

  isInitialized = true;
  return transporter;
};

// Export initialization function for startup
export const initializeEmailServiceOnStartup = () => {
  initializeEmailService();
};

const sendEmail = async ({ to, subject, html }) => {
  initializeEmailService();
  
  if (!transporter) {
    console.warn(`📭 Email skipped (transporter unavailable). Intended recipient: ${to}`);
    return;
  }

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html
  });
};

const buildRegistrationHtml = ({ firstName, userType, companyName }) => {
  const greetingName = firstName?.trim() || companyName?.trim() || 'there';
  const roleDescription =
    userType === 'company'
      ? 'Your company profile is now under review. You will receive a notification as soon as an admin verifies it.'
      : 'You can now explore tailored job matches, save interesting roles, and apply with a single click.';

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2 style="color:#2563eb;">Welcome to JobIFY, ${greetingName}!</h2>
      <p>Thanks for creating a ${userType} account.</p>
      <p>${roleDescription}</p>
      <p style="margin-top:24px;">Need help? Reply to this email and the JobIFY support team will assist.</p>
      <p style="margin-top:32px; font-size:12px; color:#64748b;">This message was sent automatically by JobIFY.</p>
    </div>
  `;
};

const buildAdminAlertHtml = ({ email, userType, companyName }) => `
  <div style="font-family: Arial, sans-serif; color: #0f172a;">
    <h3>New ${userType} registration</h3>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      ${
        companyName
          ? `<li><strong>Company:</strong> ${companyName}</li>`
          : ''
      }
      <li><strong>Created:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <p>Please review the profile in the admin panel.</p>
  </div>
`;

const buildResetHtml = ({ firstName, resetUrl, expiresInMinutes }) => `
  <div style="font-family: Arial, sans-serif; color: #0f172a;">
    <h2>Password reset requested</h2>
    <p>Hello ${firstName || 'there'},</p>
    <p>We received a request to reset your JobIFY password. Use the link below to choose a new password. The link expires in ${expiresInMinutes} minutes.</p>
    <p style="margin:24px 0;">
      <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Reset my password</a>
    </p>
    <p>If you didn't request this change, you can safely ignore the email.</p>
  </div>
`;

export const sendRegistrationEmail = async ({ email, firstName, userType, companyName }) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to JobIFY!',
      html: buildRegistrationHtml({ firstName, userType, companyName })
    });
  } catch (error) {
    console.error('❌ Failed to send registration email:', error.message);
  }
};

export const sendAdminRegistrationAlert = async ({ email, userType, companyName }) => {
  const adminEmail = getAdminAlertEmail();
  if (!adminEmail) return;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `New ${userType} registration`,
      html: buildAdminAlertHtml({ email, userType, companyName })
    });
  } catch (error) {
    console.error('❌ Failed to send admin registration alert:', error.message);
  }
};

export const sendPasswordResetEmail = async ({ email, firstName, resetUrl, expiresInMinutes = 30 }) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Reset your JobIFY password',
      html: buildResetHtml({ firstName, resetUrl, expiresInMinutes })
    });
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
  }
};

