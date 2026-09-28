/**
 * Vercel Cron calls with `Authorization: Bearer $CRON_SECRET`; `?secret=` is
 * kept for manual runs. Fails closed when CRON_SECRET isn't configured.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("secret") === secret;
}
