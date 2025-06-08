const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME || "dev@insuratrack.com",
      pass: process.env.EMAIL_PASSWORD || "dev_password",
    },
  });

  // Define email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@insuratrack.com",
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
