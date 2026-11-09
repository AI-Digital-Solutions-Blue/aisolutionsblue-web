import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/admin-auth';
import { isStatus, isUuid, storeConfig, updateContact } from '../../../lib/contacts-store';

export const prerender = false;

// Saves the status and notes of one contact. Same-origin only: Astro's checkOrigin rejects
// cross-site form posts, and the session cookie is SameSite=Strict.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAdmin(cookies)) return redirect('/admin', 303);
  const store = storeConfig();
  const form = await request.formData().catch(() => null);
  const id = String(form?.get('id') || '');
  const status = String(form?.get('status') || '');
  const notes = String(form?.get('notes') || '')
    .replace(/\0/g, '')
    .slice(0, 4000);
  const back = String(form?.get('back') || '');
  const target = /^\?[\w=&-]{0,200}$/.test(back) ? `/admin${back}` : '/admin';
  if (!store || !isUuid(id) || !isStatus(status)) return redirect(`${target}#c-${id}`, 303);
  try {
    await updateContact(store, id, { status, notes });
  } catch {
    return redirect('/admin?error=save', 303);
  }
  return redirect(`${target}#c-${id}`, 303);
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
