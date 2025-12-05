#!/usr/bin/env node

/**
 * SendGrid Configuration Diagnostic Script
 * 
 * This script helps diagnose SendGrid configuration issues.
 * Run with: node backend-system/scripts/diagnose_sendgrid.js
 */

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔍 SendGrid Configuration Diagnostic\n');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n📋 Environment Variables Status:');
console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ SET' : '❌ NOT SET');
if (process.env.SENDGRID_API_KEY) {
  const keyPrefix = process.env.SENDGRID_API_KEY.substring(0, 7);
  const keyLength = process.env.SENDGRID_API_KEY.length;
  console.log(`      Prefix: ${keyPrefix}...`);
  console.log(`      Length: ${keyLength} characters`);
  console.log(`      Valid format: ${process.env.SENDGRID_API_KEY.startsWith('SG.') ? '✅ Starts with SG.' : '❌ Should start with SG.'}`);
}

console.log('   SMTP_FROM:', process.env.SMTP_FROM || '❌ NOT SET (will use default)');
console.log('   ADMIN_ALERT_EMAIL:', process.env.ADMIN_ALERT_EMAIL || '❌ NOT SET');

// Check SendGrid connectivity
console.log('\n🧪 SendGrid Connectivity Test:');
console.log('-'.repeat(60));

if (!process.env.SENDGRID_API_KEY) {
  console.log('❌ SENDGRID_API_KEY not set. Cannot test.');
  process.exit(1);
}

try {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API key configured');

  // Test sending a simple email
  const testMsg = {
    to: 'test@example.com',
    from: process.env.SMTP_FROM || 'JobIFY <no-reply@jobify.rw>',
    subject: 'Test Email from JobIFY',
    text: 'This is a test email',
    html: '<strong>This is a test email</strong>'
  };

  console.log('\n📤 Attempting test email send...');
  console.log('   To:', testMsg.to);
  console.log('   From:', testMsg.from);
  console.log('   Subject:', testMsg.subject);

  sgMail.send(testMsg)
    .then((response) => {
      console.log('\n✅ Test email sent successfully!');
      console.log('   Status Code:', response[0]?.statusCode);
      console.log('   Message ID:', response[0]?.headers?.['x-message-id']);
      console.log('\n✨ SendGrid is properly configured!');
    })
    .catch((error) => {
      console.log('\n❌ Test email send failed!');
      console.log('   Error Code:', error.code);
      console.log('   Error Message:', error.message);
      
      if (error.response?.body?.errors) {
        console.log('   API Errors:');
        error.response.body.errors.forEach((err) => {
          console.log(`      - ${err.message} (${err.field})`);
        });
      }

      if (error.message.includes('Bad Request')) {
        console.log('\n💡 Tips:');
        console.log('   - Verify API key is correct (starts with SG.)');
        console.log('   - Check that "from" address is verified in SendGrid');
        console.log('   - Ensure email format is valid (proper HTML/text)');
        console.log('   - Check SendGrid account is active and not rate-limited');
      }

      if (error.message.includes('Unauthorized')) {
        console.log('\n💡 Tips:');
        console.log('   - API key is invalid or expired');
        console.log('   - Generate a new API key in SendGrid dashboard');
        console.log('   - API key should start with SG.');
      }
    });

} catch (err) {
  console.log('❌ Failed to initialize SendGrid:', err.message);
  process.exit(1);
}
