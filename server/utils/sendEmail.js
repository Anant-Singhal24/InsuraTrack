/**
 * EmailJS service for sending transactional emails (Password Reset, etc.)
 * Works 100% free with a personal Gmail account and requires NO custom domain.
 * Communicates over standard HTTPS (Port 443), so it is never blocked on Render.
 */
const sendEmail = async (options) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Optional, only if private key is enabled in EmailJS

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      "EmailJS configuration missing. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY in your environment variables."
    );
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: options.email,
      email: options.email,
      to_name: options.name || options.email.split("@")[0],
      name: options.name || options.email.split("@")[0],
      subject: options.subject || "InsuraTrack Password Reset",
      message: options.message,
      reset_url: options.resetUrl || "",
      reset_link: options.resetUrl || "",
    },
  };

  if (privateKey) {
    payload.accessToken = privateKey;
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("EmailJS API error:", errorText);
    throw new Error(`Email could not be sent: ${errorText || response.statusText}`);
  }

  return true;
};

module.exports = sendEmail;
