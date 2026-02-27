const nodemailer = require('nodemailer');

/**
 * ============================================================================
 * EMAIL SERVICE (The Transactional Messenger)
 * ============================================================================
 * This service handles all outbound SMTP communications.
 * It has evolved from simple console logs to a production-grade 
 * transport system using Nodemailer and HTML templating.
 */

// --- SMTP TRANSPORT CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* --- HISTORICAL STAGE 1: PRIMITIVE LOGGING ---
 * const sendEmailLegacy = (to, subject, body) => {
 *   console.log(`[LEGACY EMAIL] To: ${to} | Subject: ${subject}`);
 * };
 */

/**
 * @desc Sends account verification link
 */
exports.sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.FRONTEND_URL}/verify/${token}`;
  const mailOptions = {
    from: `"AirnbLite Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Activate your AirnbLite Account',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ff385c;">Welcome to the community, ${name}!</h2>
        <p>Please click the button below to verify your email address and start exploring unique stays.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #ff385c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

/**
 * @desc Sends booking confirmation with details
 */
exports.sendBookingConfirmationEmail = async (email, name, details) => {
  const mailOptions = {
    from: `"AirnbLite Stays" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Booking Confirmed: ${details.listingTitle}`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #ddd; padding: 2rem; border-radius: 16px;">
        <h1 style="margin-top: 0;">Stay Confirmed! ✈️</h1>
        <p>Hi ${name}, your adventure at <b>${details.listingTitle}</b> is all set.</p>
        <hr />
        <p><b>Check-in:</b> ${new Date(details.checkIn).toLocaleDateString()}</p>
        <p><b>Total Paid:</b> $${details.totalPrice}</p>
        <p>We've notified the host of your arrival. Safe travels!</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

/**
 * @desc Notifies of reservation cancellation
 */
exports.sendCancellationEmail = async (email, name, details) => {
  const mailOptions = {
    from: `"AirnbLite Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reservation Cancelled: ${details.listingTitle}`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #ddd; padding: 2rem; border-radius: 16px;">
        <h2 style="color: #ff385c;">Reservation Cancelled</h2>
        <p>Hi ${name}, your booking for <b>${details.listingTitle}</b> has been cancelled.</p>
        <p>If this was an error, please reach out to our support center.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

/**
 * @desc Sends 6-digit password reset code
 */
exports.sendResetPasswordEmail = async (email, name, code) => {
  const mailOptions = {
    from: `"AirnbLite Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Password Reset Code',
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
        <h2>Password Reset</h2>
        <p>Hi ${name}, use the code below to reset your account password:</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 0.5rem; margin: 2rem 0; color: #ff385c;">${code}</div>
        <p>This code expires in 1 hour.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

exports.sendWelcomeEmail = (email, name) => {
  // Logic for onboarding series (Phase 11 placeholder)
};
