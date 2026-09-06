/** Usernames are mapped to synthetic emails so users can sign in without an inbox. */
export const AUTH_EMAIL_DOMAIN = "golddesk.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}
