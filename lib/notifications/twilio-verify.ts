function toBasicAuth(accountSid: string, authToken: string) {
  return Buffer.from(`${accountSid}:${authToken}`).toString("base64");
}

function toE164India(phone10: string) {
  return `+91${phone10}`;
}

export async function twilioStartVerification(input: {
  accountSid: string;
  authToken: string;
  verifyServiceSid: string;
  phone10: string;
  channel: "sms" | "whatsapp";
}) {
  const to = toE164India(input.phone10);
  const params = new URLSearchParams({
    To: to,
    Channel: input.channel
  });

  const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(input.verifyServiceSid)}/Verifications`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${toBasicAuth(input.accountSid, input.authToken)}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Twilio Verify start failed: ${response.status} ${text}`);
  }
}

export async function twilioCheckVerification(input: {
  accountSid: string;
  authToken: string;
  verifyServiceSid: string;
  phone10: string;
  code: string;
}) {
  const to = toE164India(input.phone10);
  const params = new URLSearchParams({
    To: to,
    Code: input.code
  });

  const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(input.verifyServiceSid)}/VerificationCheck`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${toBasicAuth(input.accountSid, input.authToken)}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const data = (await response.json().catch(() => null)) as { status?: string } | null;
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Twilio Verify check failed: ${response.status} ${text}`);
  }

  return data?.status === "approved";
}

