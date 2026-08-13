import "dotenv/config";
import nodemailer from "nodemailer";
import { transporter } from "./lib/mailer.js";

async function main() {
  const info = await transporter.sendMail({
    from: '"Outbox Test" <no-reply@outbox.local>',
    to: "test@example.com",
    subject: "Outbox Ethereal Test",
    text: "If you can see this message in Ethereal, SMTP is working.",
  });

  console.log("Email sent!");
  console.log("Message ID:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}

main().catch((error) => {
  console.error("Email test failed:", error);
  process.exit(1);
});