export type OtpChannel = "sms" | "whatsapp";
import { sendResendEmail } from "@/lib/notifications/resend";
import { sendMsg91Otp } from "@/lib/notifications/msg91";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

export async function sendPhoneOtp(params: {
  channel: OtpChannel;
  phoneE164: string;
  otp: string;
}) {
  // OTP is generated server-side and passed to MSG91 flow variables.
  const phone10 = params.phoneE164.replace(/^\+91/, "");
  await sendMsg91Otp({
    phone10,
    channel: params.channel,
    otp: params.otp
  });
}

export async function sendEmailOtp(params: { email: string; name: string; otp: string }) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");
  const subject = "Verify your email (OTP)";
  const html = `<p>Hi ${escapeHtml(params.name)},</p><p>Your OTP is <strong>${escapeHtml(params.otp)}</strong>.</p><p>Valid for 10 minutes. Do not share it.</p>`;
  await sendResendEmail(apiKey, { to: [params.email], from, subject, html });
}

export async function sendEmailVerificationLink(params: { email: string; name: string; verificationUrl: string }) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");
  const subject = "Verify your email address";
  const html = [
    `<p>Hi ${escapeHtml(params.name)},</p>`,
    "<p>Please click the button below to verify your email address and continue registration.</p>",
    `<p><a href=\"${escapeHtml(params.verificationUrl)}\" style=\"display:inline-block;padding:10px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;\">Verify email</a></p>`,
    "<p>This link is valid for 15 minutes.</p>"
  ].join("");

  await sendResendEmail(apiKey, { to: [params.email], from, subject, html });
}

export async function broadcastNotification(params: { subject: string; message: string; users: Array<{ email: string; name: string; phoneE164: string }> }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;

  const sendEmail = Boolean(resendApiKey && resendFrom);

  if (!sendEmail) return;

  const emailJobs = sendEmail
    ? params.users.map((user) =>
        sendResendEmail(resendApiKey!, {
          to: [user.email],
          from: resendFrom!,
          subject: params.subject,
          html: `<p>Hi ${escapeHtml(user.name)},</p><p><strong>${escapeHtml(params.subject)}</strong></p><p>${escapeHtml(params.message).replace(/\n/g, "<br/>")}</p>`
        }).catch(() => null)
      )
    : [];

  await Promise.all(emailJobs);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
