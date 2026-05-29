type ResendEmail = {
  to: string[];
  from: string;
  subject: string;
  html: string;
};

export async function sendResendEmail(apiKey: string, email: ResendEmail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(email)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Resend email failed: ${response.status} ${text}`);
  }
}

