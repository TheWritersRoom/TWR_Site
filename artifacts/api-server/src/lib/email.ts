import { Resend } from "resend";

let _client: Resend | null = null;

function getClient(): Resend {
  if (!_client) {
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set.");
    }
    _client = new Resend(apiKey);
  }
  return _client;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<void> {
  const client = getClient();
  const sender = from ?? "The Writers Room <noreply@thewritersroom.online>";

  const { error } = await client.emails.send({
    from: sender,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
