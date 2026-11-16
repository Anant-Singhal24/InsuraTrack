const { Resend } = require("resend");

const sendEmail = async (options) => {
  // Resend is reliable on cloud hosts (Render, Railway, etc.)
  // Sign up free at https://resend.com to get your API key
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "InsuraTrack <onboarding@resend.dev>",
    to: options.email,
    subject: options.subject,
    html: options.message,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
