// Transactional email through Brevo, shared by the contact form and the Meta leads webhook.
import { parseSender } from './contact';
import { serverEnv } from './server-env';

export interface Email {
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  /** Traceability header, e.g. the request id of the form. */
  reference?: string;
}

export function brevoConfig() {
  const apiKey = serverEnv('BREVO_API_KEY');
  const from = serverEnv('CONTACT_FROM');
  const sender = from ? parseSender(from) : null;
  return apiKey && sender ? { apiKey, sender } : null;
}

/** Returns Brevo's message id, or null when the email was not accepted. Never throws. */
export async function sendEmail(
  config: NonNullable<ReturnType<typeof brevoConfig>>,
  email: Email,
): Promise<string | null> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        sender: config.sender,
        to: email.to.map((address) => ({ email: address })),
        ...(email.replyTo ? { replyTo: { email: email.replyTo } } : {}),
        subject: email.subject,
        textContent: email.text,
        ...(email.reference ? { headers: { 'X-Blue-Request-Id': email.reference } } : {}),
      }),
    });
    if (!response.ok) return null;
    const result = (await response.json().catch(() => null)) as { messageId?: string } | null;
    return result?.messageId || null;
  } catch {
    return null;
  }
}
