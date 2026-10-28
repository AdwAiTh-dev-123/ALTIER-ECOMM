import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL port 465
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

export default sendEmail;
