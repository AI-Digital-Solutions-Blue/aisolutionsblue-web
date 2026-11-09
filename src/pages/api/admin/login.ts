import type { APIRoute } from 'astro';
import { adminPassword, checkPassword, endSession, startSession } from '../../../lib/admin-auth';
import { createRateLimiter } from '../../../lib/contact';

export const prerender = false;
const allowAttempt = createRateLimiter(8, 15 * 60 * 1000);

export const POST: APIRoute = async ({ request, cookies, clientAddress, redirect }) => {
  const form = await request.formData().catch(() => null);
  if (form?.get('action') === 'logout') {
    endSession(cookies);
    return redirect('/admin', 303);
  }
  const password = adminPassword();
  if (!password) return redirect('/admin?error=off', 303);
  if (!allowAttempt(clientAddress || 'unknown')) return redirect('/admin?error=wait', 303);
  const attempt = String(form?.get('password') || '').slice(0, 200);
  if (!checkPassword(password, attempt)) return redirect('/admin?error=password', 303);
  startSession(cookies, password);
  return redirect('/admin', 303);
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
