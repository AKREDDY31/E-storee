type Msg91Channel = "sms" | "whatsapp";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

export async function sendMsg91Otp(input: {
  phone10: string;
  otp: string;
  channel: Msg91Channel;
}) {
  const authKey = requireEnv("MSG91_AUTH_KEY");
  const flowId =
    input.channel === "whatsapp"
      ? requireEnv("MSG91_WHATSAPP_FLOW_ID")
      : requireEnv("MSG91_SMS_FLOW_ID");

  const endpoint = process.env.MSG91_FLOW_ENDPOINT || "https://control.msg91.com/api/v5/flow/";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authkey: authKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      template_id: flowId,
      short_url: "0",
      recipients: [
        {
          mobiles: `91${input.phone10}`,
          OTP: input.otp
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`MSG91 OTP send failed: ${response.status} ${text}`);
  }
}
