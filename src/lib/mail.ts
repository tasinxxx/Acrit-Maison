// Transactional email via Resend. When RESEND_API_KEY is absent the mail
// content is written to the server log instead of silently disappearing — and
// the UI never claims an email was sent.

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

let cachedClient: { client: import("resend").Resend; from: string } | null = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const { Resend } = await import("resend");
  cachedClient = {
    client: new Resend(apiKey),
    from: process.env.RESEND_EMAIL_FROM || "onboarding@resend.dev",
  };
  return cachedClient;
}

export async function sendMail({ to, subject, text }: MailInput): Promise<boolean> {
  const configured = await getClient();
  if (!configured) {
    console.log(`[mail:not-configured] to=${to} subject="${subject}"\n${text}`);
    return false;
  }

  try {
    const { error } = await configured.client.emails.send({
      from: configured.from,
      to,
      subject,
      text,
    });
    if (error) {
      console.error(`[mail:error] to=${to} subject="${subject}":`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[mail:error] to=${to} subject="${subject}":`, err);
    return false;
  }
}
