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
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
    
    console.log('📧 Initializing Email Service...');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    console.log(`   Secure (TLS): ${isSecure}`);
    console.log(`   From: ${getFromAddress()}`);
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      requireTLS: !isSecure && smtpPort === 587,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });

    // Verify connection asynchronously in background (non-blocking, fire-and-forget)
    // Don't await or use Promise.race - just let it happen in the background
    setImmediate(() => {
      transporter.verify()
        .then(() => {
          console.log('✅ Email service verified and ready!');
        })
        .catch((err) => {
          console.error('⚠️  Email service verification warning:', err.message);
          console.error('   Note: Email may still work despite verification failure');
          // Silently continue - email will attempt to send when needed
        });
    });

    console.log(`✅ Email transporter created for ${process.env.SMTP_HOST}:${smtpPort}`);
  } else {
    console.warn('❌ Email service NOT configured - missing environment variables:');
    if (!process.env.SMTP_HOST) console.warn('   - SMTP_HOST');
    if (!process.env.SMTP_USER) console.warn('   - SMTP_USER');
    if (!process.env.SMTP_PASS) console.warn('   - SMTP_PASS');
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
    console.warn(`📭 Email Configuration Status:`);
    console.warn(`   - SMTP_HOST: ${process.env.SMTP_HOST ? '✅' : '❌'}`);
    console.warn(`   - SMTP_USER: ${process.env.SMTP_USER ? '✅' : '❌'}`);
    console.warn(`   - SMTP_PASS: ${process.env.SMTP_PASS ? '✅ (hidden)' : '❌'}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html
    });
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   📧 Subject: ${subject}`);
    console.log(`   🔑 Message ID: ${info.messageId}`);
    console.log(`   📬 Response: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}`);
    console.error(`   📧 Subject: ${subject}`);
    console.error(`   ⚠️  Error Code: ${error.code}`);
    console.error(`   ⚠️  Error Message: ${error.message}`);
    console.error(`   ⚠️  Full Error:`, error);
    // Don't throw - allow the application to continue even if email fails
    throw error;
  }
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

const buildApplicationStatusHtml = ({ candidateName, companyName, jobTitle, newStatus, note }) => {
  const statusMessages = {
    'submitted': 'Your application has been received and is waiting for review.',
    'reviewing': 'Your application is now under review by the hiring team.',
    'under review': 'Your application is now under review by the hiring team.',
    'shortlisted': 'Congratulations! You have been shortlisted for this position. The hiring team will contact you soon with next steps.',
    'interview': 'Excellent news! You have been selected for an interview. Please check your email for interview scheduling details.',
    'accepted': 'Congratulations! You have been selected for this position. The hiring team will contact you soon with offer details.',
    'rejected': 'Thank you for your interest in this position. Unfortunately, you were not selected at this time. We encourage you to apply for other suitable positions.'
  };

  const statusEmoji = {
    'submitted': '📋',
    'reviewing': '👀',
    'under review': '👀',
    'shortlisted': '⭐',
    'interview': '💼',
    'accepted': '✅',
    'rejected': '❌'
  };

  const statusMessage = statusMessages[newStatus.toLowerCase()] || 'Your application status has been updated.';
  const emoji = statusEmoji[newStatus.toLowerCase()] || '📧';

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 2rem;">${emoji}</h1>
        <h2 style="margin: 10px 0 0 0; color: #0073e6;">Application Status Update</h2>
      </div>
      
      <div style="padding: 20px 0;">
        <p>Hi ${candidateName},</p>
        
        <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #0073e6; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0;"><strong>Job Position:</strong> ${jobTitle}</p>
          <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${companyName}</p>
          <p style="margin: 0;"><strong>New Status:</strong> <span style="background: ${getStatusColor(newStatus)}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: capitalize;">${newStatus}</span></p>
        </div>
        
        <p>${statusMessage}</p>
        
        ${note ? `<div style="background: #fffbeb; padding: 15px; border-left: 4px solid #fbbf24; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0;"><strong>Note from the hiring team:</strong></p>
          <p style="margin: 0; color: #92400e;">${note}</p>
        </div>` : ''}
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://jobify-rw.vercel.app'}/applications" style="background: #0073e6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">View Your Applications</a>
        </p>
        
        <p style="margin-top: 30px; color: #64748b; font-size: 14px;">If you have any questions, please feel free to contact us at support@jobify.com</p>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3af;">
        <p>This message was sent automatically by JobIFY. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};

const getStatusColor = (status) => {
  const colors = {
    'submitted': '#3b82f6',
    'reviewing': '#f59e0b',
    'under review': '#f59e0b',
    'shortlisted': '#10b981',
    'interview': '#0369a1',
    'accepted': '#059669',
    'rejected': '#ef4444'
  };
  return colors[status.toLowerCase()] || '#6b7280';
};

export const sendApplicationStatusEmail = async ({ email, candidateName, companyName, jobTitle, newStatus, note }) => {
  try {
    await sendEmail({
      to: email,
      subject: `Application Status Update: ${newStatus} - ${jobTitle}`,
      html: buildApplicationStatusHtml({ candidateName, companyName, jobTitle, newStatus, note })
    });
  } catch (error) {
    console.error('❌ Failed to send application status email:', error.message);
  }
};

const buildCompanyApprovalHtml = ({ companyName, contactPerson, email }) => {
  const greetingName = contactPerson?.trim() || companyName?.trim() || 'there';
  
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 2rem;">✅</h1>
        <h2 style="margin: 10px 0 0 0; color: #059669;">Company Account Approved!</h2>
      </div>
      
      <div style="padding: 20px 0;">
        <p>Hello ${greetingName},</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #059669; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #059669;">Great news! Your company account has been approved.</p>
          <p style="margin: 10px 0 0 0; color: #166534;">Your company <strong>${companyName}</strong> is now active on JobIFY.</p>
        </div>
        
        <p>You can now:</p>
        <ul style="line-height: 1.8;">
          <li>Post job listings and reach qualified candidates</li>
          <li>Review and manage job applications</li>
          <li>Use AI-powered candidate matching</li>
          <li>Access your company dashboard</li>
        </ul>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://jobify-rw.vercel.app'}/dashboard" style="background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">Go to Dashboard</a>
        </p>
        
        <p style="margin-top: 30px; color: #64748b; font-size: 14px;">If you have any questions, please feel free to contact us at support@jobify.com</p>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3af;">
        <p>This message was sent automatically by JobIFY. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};

const buildCompanyRejectionHtml = ({ companyName, contactPerson, reason }) => {
  const greetingName = contactPerson?.trim() || companyName?.trim() || 'there';
  
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 2rem;">❌</h1>
        <h2 style="margin: 10px 0 0 0; color: #dc2626;">Company Account Review Update</h2>
      </div>
      
      <div style="padding: 20px 0;">
        <p>Hello ${greetingName},</p>
        
        <div style="background: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #dc2626;">Your company account application requires attention.</p>
          <p style="margin: 10px 0 0 0; color: #991b1b;">Unfortunately, your company <strong>${companyName}</strong> account could not be approved at this time.</p>
        </div>
        
        ${reason ? `<div style="background: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0;"><strong>Reason:</strong></p>
          <p style="margin: 0; color: #92400e;">${reason}</p>
        </div>` : ''}
        
        <p>You can:</p>
        <ul style="line-height: 1.8;">
          <li>Review your company information and documents</li>
          <li>Update any missing or incorrect information</li>
          <li>Resubmit your application for review</li>
          <li>Contact support if you have questions</li>
        </ul>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://jobify-rw.vercel.app'}/profile" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">Update Profile</a>
        </p>
        
        <p style="margin-top: 30px; color: #64748b; font-size: 14px;">If you have any questions, please feel free to contact us at support@jobify.com</p>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3af;">
        <p>This message was sent automatically by JobIFY. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};

export const sendCompanyApprovalEmail = async ({ email, companyName, contactPerson }) => {
  try {
    await sendEmail({
      to: email,
      subject: '✅ Your Company Account Has Been Approved - JobIFY',
      html: buildCompanyApprovalHtml({ companyName, contactPerson, email })
    });
    console.log(`📧 Company approval email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send company approval email:', error.message);
  }
};

export const sendCompanyRejectionEmail = async ({ email, companyName, contactPerson, reason }) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Company Account Review Update - JobIFY',
      html: buildCompanyRejectionHtml({ companyName, contactPerson, reason })
    });
    console.log(`📧 Company rejection email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send company rejection email:', error.message);
  }
};

