import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/admin-auth';
import { subscribePage } from '../../../lib/meta-leads';
import { serverEnv } from '../../../lib/server-env';

export const prerender = false;

// Connects Blue's Facebook Page to the leads webhook. Same-origin, signed-in team only.
export const POST: APIRoute = async ({ cookies, redirect }) => {
  if (!isAdmin(cookies)) return redirect('/admin', 303);
  const token = serverEnv('META_PAGE_TOKEN');
  const secret = serverEnv('META_APP_SECRET');
  if (!token || !secret) return redirect('/admin?meta=off', 303);
  const result = await subscribePage(token, secret);
  return redirect(
    `/admin?meta=${result.ok ? 'ok' : 'error'}&detalle=${encodeURIComponent(result.message.slice(0, 200))}`,
    303,
  );
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
