import nodemailer from "nodemailer"
import "../env"

async function sendMail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string, 10),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_TO ?? "replace-me@example.com",
    subject: "Test Email from Nodemailer",
    text: "This is a test email sent using Nodemailer with Aliyun SMTP.",
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
  } catch (error) {
    console.error("Error sending email:", error)
  }
}

sendMail()
