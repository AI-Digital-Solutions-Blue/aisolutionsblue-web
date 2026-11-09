import process from 'node:process';

/** Reads a server-only variable: Vercel's runtime env first, then the build-time .env. */
export function serverEnv(name: string): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (process.env[name] || env[name] || '').trim();
}
