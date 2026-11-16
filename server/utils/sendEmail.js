const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Use explicit Gmail SMTP settings (more reliable on cloud hosting like Render)
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL on port 465
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify transporter config — logs exact error on Render if something is wrong
  await transporter.verify().catch((err) => {
    console.error("Email transporter verification failed:", err.message);
    console.error("EMAIL_USERNAME:", process.env.EMAIL_USERNAME);
    throw new Error(`Email configuration error: ${err.message}`);
  });

  // Define email options
  const mailOptions = {
    from: `"InsuraTrack" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
