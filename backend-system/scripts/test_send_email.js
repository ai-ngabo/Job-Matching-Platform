import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    const svc = await import('../utils/emailService.js');
    console.log('Running quick email service verification test...');

    // Try to send a small test email to CONTACT_EMAIL (or to ADMIN_ALERT_EMAIL)
    const to = process.env.CONTACT_EMAIL || process.env.ADMIN_ALERT_EMAIL || process.env.TEST_EMAIL;
    if (!to) {
      console.error('No test recipient configured. Set CONTACT_EMAIL or ADMIN_ALERT_EMAIL or TEST_EMAIL in env.');
      process.exit(1);
    }

    await svc.sendContactMessage({
      firstName: 'Test',
      lastName: 'Runner',
      fromEmail: process.env.TEST_FROM || 'no-reply@test.local',
      contactPhone: '000',
      message: `This is a test message sent at ${new Date().toISOString()}`
    });

    console.log('Test message send attempted. Check logs or recipient inbox.');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
