import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/admin-auth';
import { deleteSpend, parseSpend, saveSpend } from '../../../lib/ad-spend';
import { isUuid, storeConfig } from '../../../lib/contacts-store';

export const prerender = false;

// Saves or deletes a line of ad spend. Same-origin only (Astro's checkOrigin and the
// SameSite=Strict session cookie), like the rest of the portal.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAdmin(cookies)) return redirect('/admin', 303);
  const store = storeConfig();
  const form = await request.formData().catch(() => null);
  const back = String(form?.get('back') || '');
  const target = /^\?[\w=&-]{0,100}$/.test(back) ? `/admin/inversion${back}` : '/admin/inversion';
  const join = target.includes('?') ? '&' : '?';
  if (!store || !form) return redirect(`${target}${join}error=db`, 303);

  if (form.get('action') === 'delete') {
    const id = String(form.get('id') || '');
    if (!isUuid(id)) return redirect(target, 303);
    try {
      await deleteSpend(store, id);
    } catch {
      return redirect(`${target}${join}error=delete`, 303);
    }
    return redirect(`${target}${join}hecho=eliminado`, 303);
  }

  const row = parseSpend(form);
  if (typeof row === 'string') return redirect(`${target}${join}error=${row}`, 303);
  try {
    await saveSpend(store, row);
  } catch {
    return redirect(`${target}${join}error=save`, 303);
  }
  return redirect(`${target}${join}hecho=guardado`, 303);
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
