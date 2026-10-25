import nodemailer from "nodemailer";

const isEmailConfigured = Boolean(
  process.env.GOOGLE_USER &&
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_REFRESH_TOKEN
);

let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.warn("Email server connection verification failed:", error.message);
      return;
    }
    console.log("Email server is ready to send messages");
  });
}

export const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    console.warn(`Email not configured. Simulated email to: ${to}, Subject: ${subject}`);
    return { messageId: `mock_email_${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from: `"FRAME" <${process.env.GOOGLE_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};
