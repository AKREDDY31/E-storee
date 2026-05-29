import crypto from "crypto";

export function generateOtp(length = 6) {
  const digits = "0123456789";
  const bytes = crypto.randomBytes(length);
  let otp = "";
  for (let index = 0; index < length; index += 1) {
    otp += digits[bytes[index] % 10];
  }
  return otp;
}

export function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

