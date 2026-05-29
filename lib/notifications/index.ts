export type OtpChannel = "sms" | "whatsapp";
import { sendResendEmail } from "@/lib/notifications/resend";
import { twilioStartVerification } from "@/lib/notifications/twilio-verify";

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
  // OTP is handled by Twilio Verify; ignore `otp` and send via requested channel.
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const verifyServiceSid = requireEnv("TWILIO_VERIFY_SERVICE_SID");
  const phone10 = params.phoneE164.replace(/^\+91/, "");
  await twilioStartVerification({
    accountSid,
    authToken,
    verifyServiceSid,
    phone10,
    channel: params.channel
  });
}

export async function sendEmailOtp(params: { email: string; name: string; otp: string }) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");
  const subject = "Verify your email (OTP)";
  const html = `<p>Hi ${escapeHtml(params.name)},</p><p>Your OTP is <strong>${escapeHtml(params.otp)}</strong>.</p><p>Valid for 10 minutes. Do not share it.</p>`;
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
