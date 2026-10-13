const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // 16-character Google App Password
    },
  });

  await transporter.sendMail({
    from: `"ATELIER" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = sendEmail;
