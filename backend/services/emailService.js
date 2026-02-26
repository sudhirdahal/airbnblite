const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = (email, name, token) => {
  const url = `${process.env.FRONTEND_URL}/verify/${token}`;
  transporter.sendMail({
    to: email,
    subject: 'Verify your AirBnB Lite Account',
    html: `<h1>Welcome ${name}!</h1><p>Please verify your email by clicking <a href="${url}">here</a></p>`
  });
};

exports.sendWelcomeEmail = (email, name) => {
  transporter.sendMail({
    to: email,
    subject: 'Welcome to AirBnB Lite',
    html: `<h1>Hi ${name}!</h1><p>Your account is now verified. Start exploring!</p>`
  });
};

exports.sendBookingConfirmationEmail = (email, name, booking) => {
  transporter.sendMail({
    to: email,
    subject: 'Booking Confirmed - AirBnB Lite',
    html: `<h1>Stay Confirmed!</h1><p>Hi ${name}, your stay at <strong>${booking.listingTitle}</strong> is confirmed for ${booking.checkIn} to ${booking.checkOut}. Total: $${booking.totalPrice}</p>`
  });
};

exports.sendResetPasswordEmail = (email, name, token) => {
  transporter.sendMail({
    to: email,
    subject: 'Password Reset Code',
    html: `<h1>Reset your password</h1><p>Hi ${name}, your 6-digit reset code is: <strong>${token}</strong>. It expires in 1 hour.</p>`
  });
};

// --- NEW: Cancellation Notification ---
exports.sendCancellationEmail = (email, name, details) => {
  transporter.sendMail({
    to: email,
    subject: 'Reservation Cancelled - AirBnB Lite',
    html: `
      <h1>Booking Cancelled</h1>
      <p>Hi ${name},</p>
      <p>Your reservation for <strong>${details.listingTitle}</strong> (${details.checkIn} - ${details.checkOut}) has been successfully cancelled.</p>
      <p>If this wasn't you, please contact support immediately.</p>
    `
  });
};
