const nodemailer = require('nodemailer');

// Create a single Nodemailer transporter instance.
// This transporter is configured once and reused for all email sending functions.
// Configuration is pulled from environment variables for flexibility (Mailtrap for dev, real SMTP for prod).
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io", // SMTP server host
  port: process.env.EMAIL_PORT || 2525,                     // SMTP server port
  secure: process.env.EMAIL_PORT == 465,                    // Use SSL/TLS if port is 465 (e.g., for Gmail)
  auth: {
    user: process.env.EMAIL_USER,                         // SMTP username
    pass: process.env.EMAIL_PASS                          // SMTP password
  }
});

// Verify connection to the SMTP server on application startup.
// This helps to quickly diagnose issues with email credentials or server availability.
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

/**
 * Sends a verification email to a newly registered user.
 * The email contains a link that the user must click to activate their account.
 * @param {string} userEmail - The email address of the user to verify.
 * @param {string} userName - The name of the user.
 * @param {string} token - The unique verification token.
 */
const sendVerificationEmail = async (userEmail, userName, token) => {
  // Construct the verification URL using the frontend's base URL and the token.
  const verificationUrl = `http://localhost:5173/verify/${token}`; // Frontend URL

  const mailOptions = {
    from: `"AirBnB Lite" <verify@airnblite.com>`, // Sender email address
    to: userEmail,                                 // Recipient email address
    subject: 'Please verify your email address ✉️', // Email subject
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; padding: 20px;">
        <h2 style="color: #333;">Action Required: Verify your email</h2>
        <p>Hi ${userName},</p>
        <p>Thanks for signing up! Please click the button below to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #ff385c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="font-size: 0.8rem; color: #717171;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 0.8rem; color: #717171;">${verificationUrl}</p>
      </div>
    ` // HTML content for the email body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', userEmail, 'ID:', info.messageId);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

/**
 * Sends a welcome email to a user after their email has been verified.
 * @param {string} userEmail - The email address of the welcomed user.
 * @param {string} userName - The name of the welcomed user.
 */
const sendWelcomeEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: `"AirBnB Lite" <welcome@airnblite.com>`, // Sender email address
    to: userEmail,                                 // Recipient email address
    subject: 'Welcome to AirBnB Lite! 🏠',         // Email subject
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; padding: 20px;">
        <h2 style="color: #ff385c;">Welcome to AirBnB Lite, ${userName}!</h2>
        <p>We're thrilled to have you join our community of travelers and hosts.</p>
        <p>Now you can:</p>
        <ul>
          <li>Browse unique homes around the world</li>
          <li>Book stays with ease</li>
          <li>Save your favorite listings to your wishlist</li>
        </ul>
        <a href="http://localhost:5173" style="display: inline-block; padding: 10px 20px; background-color: #ff385c; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Start Exploring</a>
        <p style="margin-top: 20px; font-size: 0.8rem; color: #717171;">If you didn't create this account, please ignore this email.</p>
      </div>
    ` // HTML content for the email body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully! ID:', info.messageId);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

/**
 * Sends a booking confirmation email to a user after they successfully book a listing.
 * @param {string} userEmail - The email address of the booking user.
 * @param {string} userName - The name of the booking user.
 * @param {object} bookingDetails - Object containing details about the booking and listing.
 */
const sendBookingConfirmationEmail = async (userEmail, userName, bookingDetails) => {
  const mailOptions = {
    from: `"AirBnB Lite Bookings" <bookings@airnblite.com>`, // Sender email address
    to: userEmail,                                           // Recipient email address
    subject: `Booking Confirmed: ${bookingDetails.listingTitle} ✈️`, // Email subject
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; padding: 20px;">
        <h2 style="color: #ff385c;">Pack your bags, ${userName}!</h2>
        <p>Your booking is confirmed. Here are your trip details:</p>
        
        <div style="background-color: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${bookingDetails.listingTitle}</h3>
          <p><strong>Check-in:</strong> ${new Date(bookingDetails.checkIn).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(bookingDetails.checkOut).toLocaleDateString()}</p>
          <p><strong>Total Price:</strong> $${bookingDetails.totalPrice}</p>
          <p><strong>Location:</strong> ${bookingDetails.location}</p>
        </div>

        <p>You can view your full itinerary in your <a href="http://localhost:5173/bookings" style="color: #ff385c; font-weight: bold; text-decoration: none;">Trips</a> section.</p>
        
        <p style="margin-top: 20px; font-size: 0.8rem; color: #717171;">Need help? Reply to this email or visit our help center.</p>
      </div>
    ` // HTML content for the email body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent! ID:', info.messageId);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
};

/**
 * Sends a password reset email containing a temporary code.
 * @param {string} userEmail - The email address of the user.
 * @param {string} userName - The name of the user.
 * @param {string} resetToken - The 6-digit reset code.
 */
const sendResetPasswordEmail = async (userEmail, userName, resetToken) => {
  const mailOptions = {
    from: `"AirBnB Lite Security" <security@airnblite.com>`, // Sender email address
    to: userEmail,                                           // Recipient email address
    subject: 'Password Reset Request 🔑',                   // Email subject
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; padding: 20px;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Hi ${userName},</p>
        <p>You requested to reset your password. Use the following code to complete the process. This code is valid for <strong>1 hour</strong>.</p>
        
        <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="margin: 0; letter-spacing: 5px; color: #ff385c;">${resetToken}</h1>
        </div>

        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        
        <p style="margin-top: 20px; font-size: 0.8rem; color: #717171;">This is an automated security message from AirBnB Lite.</p>
      </div>
    ` // HTML content for the email body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reset password email sent! ID:', info.messageId);
  } catch (error) {
    console.error('Error sending reset password email:', error);
  }
};

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendBookingConfirmationEmail, sendResetPasswordEmail };
