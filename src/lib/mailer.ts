import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM =
  process.env.SMTP_FROM || "RybiaPaka.pl <no-reply@rybiapaka.pl>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }: MailPayload) {
  const transport = getTransporter();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.info(
      "[mailer] SMTP not configured. Skipping email send.",
      { to, subject, text }
    );
    return;
  }

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}
