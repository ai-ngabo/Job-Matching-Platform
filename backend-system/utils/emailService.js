import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import EmailQueue from '../models/EmailQueue.js';

let transporter = null;
let isInitialized = false;
let sendGridEnabled = false;

const getFromAddress = () => process.env.SMTP_FROM || 'JobIFY <no-reply@jobify.rw>';
const getAdminAlertEmail = () => process.env.ADMIN_ALERT_EMAIL || '';

const initializeEmailService = () => {
  if (isInitialized) return transporter;

  const isEmailConfigured =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  // Configure SendGrid if API key provided
  if (process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      sendGridEnabled = true;
      console.log('📬 SendGrid enabled (API) for transactional emails');
    } catch (err) {
      console.warn('⚠️  SendGrid initialization failed:', err?.message || err);
      sendGridEnabled = false;
    }
  }

  if (isEmailConfigured) {
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    console.log('📧 Initializing Email Service...');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    console.log(`   Secure (TLS): ${isSecure}`);
    console.log(`   From: ${getFromAddress()}`);

    // Increase timeouts slightly to avoid short-lived network blips causing ETIMEDOUT
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
      // timeouts (ms) - increased to be more tolerant on cloud hosts
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 20000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 20000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
      // small pool to avoid saturating provider connections
      maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 5),
      maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 100)
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
  // Start background worker to process queued emails
  startQueueWorkerIfNeeded();
};

const sendEmail = async ({ to, subject, html }) => {
  initializeEmailService();

  const msg = { from: getFromAddress(), to, subject, html };

  // Helper: exponential backoff retry
  const retryWithBackoff = async (fn, attempts = 3) => {
    let lastError;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const delay = Math.pow(2, i) * 500; // 500ms, 1000ms, 2000ms
        console.warn(`⚠️ Email attempt ${i + 1} failed. Retrying in ${delay}ms...`, err?.message || err);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError;
  };

  // If SendGrid is enabled, prefer it (HTTP-based, less likely to be blocked on hosted platforms)
  if (sendGridEnabled) {
    try {
      const sendViaSendGrid = async () => {
        // SendGrid requires proper message object with text or html
        const sgMsg = {
          to,
          from: msg.from,
          subject: msg.subject,
          html: msg.html,
          text: msg.html?.replace(/<[^>]*>/g, '') || 'Email from JobIFY' // Strip HTML for text version
        };
        console.log('📤 Sending via SendGrid with message:', { to, subject: sgMsg.subject, from: sgMsg.from });
        const res = await sgMail.send(sgMsg);
        return res;
      };

      const info = await retryWithBackoff(sendViaSendGrid);
      console.log(`✅ SendGrid email sent to ${to}`);
      return info;
    } catch (sgError) {
      console.error('❌ SendGrid send failed:', sgError?.message || sgError);
      if (sgError.response?.body?.errors) {
        console.error('   Errors:', sgError.response.body.errors);
      }
      // Fall through to try SMTP if available
    }
  }

  // Attempt via SMTP if transporter available
  if (transporter) {
    try {
      const sendViaSMTP = async () => {
        const info = await transporter.sendMail(msg);
        return info;
      };

      const info = await retryWithBackoff(sendViaSMTP);
      console.log(`✅ SMTP email sent successfully to ${to}`);
      console.log(`   📧 Subject: ${subject}`);
      console.log(`   🔑 Message ID: ${info.messageId}`);
      console.log(`   📬 Response: ${info.response}`);
      return info;
    } catch (smtpError) {
      console.error(`❌ Failed to send email via SMTP to ${to}`);
      console.error(`   📧 Subject: ${subject}`);
      console.error(`   ⚠️  Error Code: ${smtpError.code}`);
      console.error(`   ⚠️  Error Message: ${smtpError.message}`);
      console.error(`   ⚠️  Full Error:`, smtpError);
      // If SendGrid wasn't used earlier and is available, try it now as a last resort
      if (!sendGridEnabled && process.env.SENDGRID_API_KEY) {
        try {
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          sendGridEnabled = true;
          const sgMsg = {
            to,
            from: msg.from,
            subject: msg.subject,
            html: msg.html,
            text: msg.html?.replace(/<[^>]*>/g, '') || 'Email from JobIFY'
          };
          const sgRes = await retryWithBackoff(() => sgMail.send(sgMsg));
          console.log(`✅ SendGrid (fallback) email sent to ${to}`);
          return sgRes;
        } catch (sgFallbackError) {
          console.error('❌ SendGrid fallback also failed:', sgFallbackError?.message || sgFallbackError);
        }
      }

      // As a resilience measure, enqueue the failed message to the DB for retry by the background worker
      try {
        await EmailQueue.create({
          to,
          from: msg.from,
          subject: msg.subject,
          html: msg.html,
          attempts: 1,
          status: 'pending',
          nextAttemptAt: new Date(Date.now() + 60 * 1000) // retry after 1 minute
        });
        console.log(`🔁 Enqueued email to ${to} for later retry`);
      } catch (queueErr) {
        console.error('❌ Failed to enqueue email for retry:', queueErr?.message || queueErr);
      }

      // Propagate the original SMTP error to caller as well
      throw smtpError;
    }
  }

  // If neither SendGrid nor SMTP is available
  console.warn(`📭 Email skipped (no available transport). Intended recipient: ${to}`);
  console.warn(`   - SENDGRID: ${sendGridEnabled ? '✅' : '❌'}`);
  console.warn(`   - SMTP_HOST: ${process.env.SMTP_HOST ? '✅' : '❌'}`);
  console.warn(`   - SMTP_USER: ${process.env.SMTP_USER ? '✅' : '❌'}`);
  console.warn(`   - SMTP_PASS: ${process.env.SMTP_PASS ? '✅' : '❌'}`);
  return;
};

// Background worker to process queued emails
let queueWorkerStarted = false;
const processQueuedEmails = async () => {
  if (queueWorkerStarted) return;
  queueWorkerStarted = true;

  const concurrency = Number(process.env.EMAIL_QUEUE_CONCURRENCY || 3);
  const pollIntervalMs = Number(process.env.EMAIL_QUEUE_POLL_MS || 30 * 1000);

  console.log(`📮 Starting email queue worker (poll ${pollIntervalMs}ms, concurrency ${concurrency})`);

  const runIteration = async () => {
    try {
      const now = new Date();
      const items = await EmailQueue.find({ status: 'pending', nextAttemptAt: { $lte: now } }).limit(concurrency).sort({ nextAttemptAt: 1 }).lean();
      for (const item of items) {
        try {
          // Mark processing
          await EmailQueue.findByIdAndUpdate(item._id, { status: 'processing', lastAttemptAt: new Date() });

          // Attempt to send using same sendEmail flow but bypassing enqueue-on-fail to avoid recursion
          try {
            // Try SendGrid first if enabled
            if (process.env.SENDGRID_API_KEY) {
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              await sgMail.send({ to: item.to, from: item.from || getFromAddress(), subject: item.subject, html: item.html });
              await EmailQueue.findByIdAndUpdate(item._id, { status: 'sent' });
              console.log(`✅ Queued email sent to ${item.to} (id: ${item._id}) via SendGrid`);
              continue;
            }

            if (transporter) {
              await transporter.sendMail({ from: item.from || getFromAddress(), to: item.to, subject: item.subject, html: item.html });
              await EmailQueue.findByIdAndUpdate(item._id, { status: 'sent' });
              console.log(`✅ Queued email sent to ${item.to} (id: ${item._id}) via SMTP`);
              continue;
            }

            // If no transport available, mark failed
            await EmailQueue.findByIdAndUpdate(item._id, { status: 'failed', lastError: 'no transport available' });
          } catch (sendErr) {
            const attempts = (item.attempts || 0) + 1;
            const backoffMs = Math.min(60 * 60 * 1000, Math.pow(2, attempts) * 1000); // cap at 1h
            await EmailQueue.findByIdAndUpdate(item._id, { status: 'pending', attempts, lastError: sendErr?.message || String(sendErr), nextAttemptAt: new Date(Date.now() + backoffMs) });
            console.warn(`⚠️ Queued email attempt ${attempts} failed for ${item.to}. Next attempt in ${backoffMs}ms`);
          }
        } catch (err) {
          console.error('❌ Error processing queued email item:', err);
        }
      }
    } catch (err) {
      console.error('❌ Email queue worker error:', err);
    } finally {
      setTimeout(runIteration, pollIntervalMs);
    }
  };

  // Start the loop
  setImmediate(runIteration);
};

// Start queue worker when email service initializes (non-blocking)
const startQueueWorkerIfNeeded = () => {
  try {
    processQueuedEmails();
  } catch (err) {
    console.error('❌ Failed to start email queue worker:', err);
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

// ====== Application Confirmation Email - Conversational ======
const buildApplicationConfirmationHtml = ({ candidateName, jobTitle, companyName, applicationId, appliedDate }) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 2rem;">👋</h1>
        <h2 style="margin: 10px 0 0 0; color: #059669;">Hi ${candidateName}, your application is in!</h2>
      </div>

      <div style="padding: 20px 0;">
        <p>Great news! We've successfully received your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        
        <p>We know you're probably excited (and maybe a little nervous!) about this opportunity, so we wanted to give you a quick update on what happens next.</p>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #059669;">Your application details:</h3>
          <div style="background: white; padding: 15px; border-radius: 6px;">
            <p style="margin: 10px 0;"><strong>🎯 Position:</strong> ${jobTitle}</p>
            <p style="margin: 10px 0;"><strong>🏢 Company:</strong> ${companyName}</p>
            <p style="margin: 10px 0;"><strong>📋 Application ID:</strong> ${applicationId}</p>
            <p style="margin: 10px 0;"><strong>📅 Submitted:</strong> ${appliedDate}</p>
          </div>
        </div>

        <h3 style="color: #374151; margin: 30px 0 15px 0;">Here's what to expect next:</h3>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
            <div style="background: #dbeafe; color: #1e40af; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">1</div>
            <div>
              <p style="margin: 0; font-weight: 500; color: #1e40af;">Application received (That's now!)</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Your application is now in the hiring team's queue for review.</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
            <div style="background: #fef3c7; color: #92400e; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">2</div>
            <div>
              <p style="margin: 0; font-weight: 500; color: #92400e;">Review process</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">The ${companyName} team will review your qualifications and experience.</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="background: #dcfce7; color: #166534; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">3</div>
            <div>
              <p style="margin: 0; font-weight: 500; color: #166534;">Updates from us</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">We'll keep you posted every step of the way via email.</p>
            </div>
          </div>
        </div>

        <p style="font-style: italic; color: #64748b; padding: 15px; border-left: 4px solid #a5b4fc;">
          "The typical review process takes 1-2 weeks, but we'll be sure to update you as soon as we hear anything!"
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://jobify-rw.vercel.app'}/applications" style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);">
            View Your Applications Dashboard
          </a>
        </div>

        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-top: 25px;">
          <p style="margin: 0; color: #dc2626; font-size: 14px;">
            <strong>📌 Quick tip:</strong> Keep an eye on your email (and maybe check spam folder) for updates from ${companyName}!
          </p>
        </div>

        <p style="margin-top: 30px; color: #64748b; text-align: center;">
          Got questions? We're here to help at 
          <a href="mailto:support@jobify.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">support@jobify.com</a>
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3af;">
        <p style="margin: 5px 0;">This is an automated message from your friends at JobIFY.</p>
        <p style="margin: 5px 0;">Good luck with your application! 🍀</p>
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} JobIFY AI Job Matching Platform</p>
      </div>
    </div>
  `;
};

// ====== Application Status Update Email - Conversational ======
const buildApplicationStatusHtml = ({ candidateName, companyName, jobTitle, newStatus, note, nextSteps }) => {
  const statusConfig = {
    'submitted': {
      emoji: '📋',
      title: 'Your application is in!',
      color: '#3b82f6',
      message: `Great news, ${candidateName}! Your application for the ${jobTitle} position at ${companyName} has been successfully submitted and received.`
    },
    'reviewing': {
      emoji: '👀',
      title: 'Your application is being reviewed!',
      color: '#f59e0b',
      message: `Good news, ${candidateName}! The hiring team at ${companyName} is now reviewing your application for the ${jobTitle} position.`
    },
    'shortlisted': {
      emoji: '⭐',
      title: 'You\'ve been shortlisted!',
      color: '#10b981',
      message: `Fantastic news, ${candidateName}! You've been shortlisted for the ${jobTitle} position at ${companyName}! This is a big step forward.`
    },
    'interview': {
      emoji: '🎯',
      title: 'Interview time!',
      color: '#8b5cf6',
      message: `Excellent news, ${candidateName}! You've been selected for an interview for the ${jobTitle} position at ${companyName}.`
    },
    'accepted': {
      emoji: '🎉',
      title: 'Congratulations! You got it!',
      color: '#059669',
      message: `HUGE congratulations, ${candidateName}! You've been accepted for the ${jobTitle} position at ${companyName}!`
    },
    'rejected': {
      emoji: '🤝',
      title: 'Update on your application',
      color: '#6b7280',
      message: `Hi ${candidateName}, we have an update regarding your application for the ${jobTitle} position at ${companyName}.`
    }
  };

  const config = statusConfig[newStatus.toLowerCase()] || {
    emoji: '📧',
    title: 'Application Update',
    color: '#6b7280',
    message: `Hi ${candidateName}, we have an update regarding your application for the ${jobTitle} position at ${companyName}.`
  };

  const defaultNextSteps = {
    'submitted': 'The hiring team will review your application within 1-2 weeks. Keep an eye on your email for updates!',
    'reviewing': 'The review process typically takes 1-2 weeks. We\'ll notify you as soon as there\'s an update.',
    'shortlisted': 'The hiring team will contact you soon to schedule the next steps. Make sure to check your email regularly!',
    'interview': 'Check your email for interview details and scheduling. Prepare well and good luck!',
    'accepted': 'The hiring team will contact you with offer details and next steps. Congratulations again!',
    'rejected': 'Don\'t be discouraged! This is just one opportunity. We encourage you to apply for other positions that match your skills.'
  };

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 3rem; margin-bottom: 10px;">${config.emoji}</div>
        <h2 style="margin: 0; color: ${config.color};">${config.title}</h2>
      </div>

      <div style="padding: 20px 0;">
        <p>${config.message}</p>

        <div style="background: ${config.color}10; border-left: 4px solid ${config.color}; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0; color: ${config.color}; font-weight: 600;">
            Position: ${jobTitle}<br>
            Company: ${companyName}<br>
            Status: <span style="background: ${config.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px; text-transform: capitalize;">${newStatus}</span>
          </p>
        </div>

        ${note ? `
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">A note from ${companyName}:</p>
            <p style="margin: 0; color: #92400e;">"${note}"</p>
          </div>
        ` : ''}

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #374151;">What this means:</h3>
          <p style="margin: 0; color: #6b7280;">${nextSteps || defaultNextSteps[newStatus.toLowerCase()] || 'Please check your dashboard for more details.'}</p>
        </div>

        ${newStatus.toLowerCase() === 'rejected' ? `
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #dc2626; font-size: 14px;">
              <strong>Remember:</strong> Every "no" brings you closer to your "yes". Don't give up! 💪
            </p>
          </div>
        ` : ''}

        ${newStatus.toLowerCase() === 'accepted' ? `
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 18px;">
              🎊 CONGRATULATIONS! 🎊<br>
              You did it! Welcome to the team!
            </p>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://jobify-rw.vercel.app'}/applications" style="background: linear-gradient(135deg, ${config.color}, ${config.color}dd); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px ${config.color}40;">
            View Application Details
          </a>
        </div>

        <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          <strong>The JobIFY Team</strong><br>
          <span style="font-size: 12px;">We're cheering for you! 🌟</span>
        </p>
      </div>
    </div>
  `;
};

// KEEPING THE ORIGINAL APPLICATION STATUS EMAIL FUNCTION (for backward compatibility)
const buildApplicationStatusHtmlOriginal = ({ candidateName, companyName, jobTitle, newStatus, note }) => {        
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

// ====== EXPORTED FUNCTIONS ======

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

// NEW: Conversational application confirmation email
export const sendApplicationConfirmationEmail = async ({ email, candidateName, jobTitle, companyName, applicationId }) => {
  try {
    const appliedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await sendEmail({
      to: email,
      subject: `👋 Application received: ${jobTitle} at ${companyName}`,
      html: buildApplicationConfirmationHtml({ 
        candidateName, 
        jobTitle, 
        companyName, 
        applicationId,
        appliedDate 
      })
    });
    console.log(`📧 Application confirmation email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send application confirmation email:', error.message);
  }
};

// UPDATED: Conversational application status email
export const sendApplicationStatusEmail = async ({ email, candidateName, companyName, jobTitle, newStatus, note }) => {
  try {
    await sendEmail({
      to: email,
      subject: `📋 Application Update: ${newStatus} - ${jobTitle}`,
      html: buildApplicationStatusHtml({ 
        candidateName, 
        companyName, 
        jobTitle, 
        newStatus, 
        note 
      })
    });
    console.log(`📧 Application status update email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send application status email:', error.message);
  }
};

// KEEPING: Original application status email function (for backward compatibility)
export const sendApplicationStatusEmailOriginal = async ({ email, candidateName, companyName, jobTitle, newStatus, note }) => {
  try {
    await sendEmail({
      to: email,
      subject: `Application Status Update: ${newStatus} - ${jobTitle}`,
      html: buildApplicationStatusHtmlOriginal({ candidateName, companyName, jobTitle, newStatus, note })
    });
  } catch (error) {
    console.error('❌ Failed to send application status email:', error.message);
  }
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

// Send messages from website contact form to the JobIFY support Gmail
export const sendContactMessage = async ({ firstName, lastName, fromEmail, contactPhone, message }) => {   
  const to = process.env.CONTACT_EMAIL || 'jobifyrwanda@gmail.com';
  const subject = `Website Contact Form: ${firstName || ''} ${lastName || ''}`.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h3>New contact form submission</h3>
      <ul>
        <li><strong>Name:</strong> ${firstName || ''} ${lastName || ''}</li>
        <li><strong>Email:</strong> ${fromEmail || ''}</li>
        <li><strong>Phone:</strong> ${contactPhone || ''}</li>
        <li><strong>Created:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <div style="margin-top:12px; padding:12px; background:#f8fafc; border-radius:6px;">
        <p style="margin:0;"><strong>Message:</strong></p>
        <p style="margin:8px 0 0 0; white-space:pre-wrap;">${message || ''}</p>
      </div>
      <p style="margin-top:16px; color:#64748b; font-size:12px;">This notification was generated by the JobIFY website contact form.</p>
    </div>
  `;

  try {
    await sendEmail({ to, subject, html });
    console.log(`📧 Contact form forwarded to ${to}`);
  } catch (error) {
    console.error('❌ Failed to forward contact form:', error.message);
    throw error;
  }
};

// Verify transports programmatically. Will attempt SendGrid if API key present; otherwise verify SMTP transporter.
export const verifyEmailTransport = async ({ to } = {}) => {
  initializeEmailService();

  const target = to || process.env.CONTACT_EMAIL || process.env.ADMIN_ALERT_EMAIL || process.env.TEST_EMAIL;

  // If SendGrid key present, try sending a small verification email (lightweight)
  if (process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const sgMsg = {
        to: target,
        from: getFromAddress(),
        subject: 'JobIFY — Email transport verification',
        html: `<p>This is a test verification email sent at ${new Date().toISOString()}.</p>`
      };
      const res = await sgMail.send(sgMsg);
      return { ok: true, transport: 'sendgrid', detail: res };
    } catch (err) {
      return { ok: false, transport: 'sendgrid', error: err?.message || err };
    }
  }

  // Otherwise try SMTP transporter verify
  if (transporter) {
    try {
      await transporter.verify();
      return { ok: true, transport: 'smtp', detail: 'smtp verified' };
    } catch (err) {
      return { ok: false, transport: 'smtp', error: err?.message || err };
    }
  }

  return { ok: false, transport: 'none', error: 'no transport configured' };
};