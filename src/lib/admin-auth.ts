// Access to the contacts portal: one team password (ADMIN_PASSWORD, set in Vercel) and a signed,
// HttpOnly session cookie. The cookie is signed with a key derived from the password, so changing
// the password signs everyone out.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { serverEnv } from './server-env';

export const SESSION_COOKIE = 'blue_admin';
const SESSION_SECONDS = 12 * 60 * 60;
const MIN_PASSWORD = 12;

export function adminPassword() {
  const password = serverEnv('ADMIN_PASSWORD');
  return password.length >= MIN_PASSWORD ? password : '';
}

const key = (password: string) =>
  createHash('sha256').update(`blue-admin-session:${password}`).digest();
const sign = (password: string, expires: number) =>
  createHmac('sha256', key(password)).update(String(expires)).digest('hex');

function same(a: string, b: string) {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right) && a.length === b.length;
}

export const checkPassword = (password: string, attempt: string) =>
  Boolean(password) && same(attempt, password);

export function sessionValue(password: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + SESSION_SECONDS;
  return `${expires}.${sign(password, expires)}`;
}

export function validSession(password: string, value: string | undefined, now = Date.now()) {
  if (!password || !value) return false;
  const match = value.match(/^(\d{10})\.([a-f\d]{64})$/);
  if (!match) return false;
  const expires = Number(match[1]);
  if (expires <= Math.floor(now / 1000)) return false;
  return same(match[2], sign(password, expires));
}

export function isAdmin(cookies: AstroCookies) {
  return validSession(adminPassword(), cookies.get(SESSION_COOKIE)?.value);
}

export function startSession(cookies: AstroCookies, password: string) {
  cookies.set(SESSION_COOKIE, sessionValue(password), {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export const NO_INDEX = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'same-origin',
};
