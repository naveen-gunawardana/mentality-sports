/** A team code opened while signed out is parked here and redeemed on the athlete's dashboard. */
export const PENDING_TEAM_KEY = "mentality_pending_team";

export function normalizeTeamCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function isTeamCode(v: string) {
  return /^[A-Z0-9]{6}$/.test(v);
}

export function teamJoinUrl(code: string, origin = "https://mentalitysports.com") {
  return `${origin}/join/${code}`;
}

export function friendlyTeamError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("not found")) return "That code didn't match a team. Check it with your coach.";
  if (m.includes("only athletes")) return "Team codes are for athlete accounts.";
  return "Couldn't join right now. Try again in a minute.";
}
