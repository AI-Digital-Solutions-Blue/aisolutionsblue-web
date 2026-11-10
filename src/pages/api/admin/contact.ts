import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/admin-auth';
import {
  deleteContact,
  isStatus,
  isUuid,
  storeConfig,
  updateContact,
} from '../../../lib/contacts-store';

export const prerender = false;

// Saves the status and notes of one contact, or deletes it (action=delete). Same-origin only:
// Astro's checkOrigin rejects cross-site form posts, and the session cookie is SameSite=Strict.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAdmin(cookies)) return redirect('/admin', 303);
  const store = storeConfig();
  const form = await request.formData().catch(() => null);
  const id = String(form?.get('id') || '');
  const back = String(form?.get('back') || '');
  const target = /^\?[\w=&-]{0,200}$/.test(back) ? `/admin${back}` : '/admin';
  const join = target.includes('?') ? '&' : '?';

  if (form?.get('action') === 'delete') {
    if (!store || !isUuid(id)) return redirect(target, 303);
    try {
      await deleteContact(store, id);
    } catch {
      return redirect(`${target}${join}error=delete`, 303);
    }
    return redirect(`${target}${join}hecho=eliminado`, 303);
  }

  const status = String(form?.get('status') || '');
  const notes = String(form?.get('notes') || '')
    .replace(/\0/g, '')
    .slice(0, 4000);
  if (!store || !isUuid(id) || !isStatus(status)) return redirect(`${target}#c-${id}`, 303);
  try {
    await updateContact(store, id, { status, notes });
  } catch {
    return redirect('/admin?error=save', 303);
  }
  return redirect(`${target}${join}hecho=guardado#c-${id}`, 303);
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
