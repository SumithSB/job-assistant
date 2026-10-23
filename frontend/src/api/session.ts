const AUTH_PREFIX = "/api/v1/auth/";

/**
 * Whether a failed response should drop the stored access token.
 *
 * Only a 401 on a call that actually sent `Authorization` ends the session.
 * Login and register return 401 for bad credentials and must leave any
 * existing token alone.
 */
export function shouldClearSession(
  status: number,
  sentAuthorization: boolean,
  path: string,
): boolean {
  if (status !== 401 || !sentAuthorization) return false;
  const pathOnly = path.split(/[?#]/, 1)[0] ?? path;
  return !pathOnly.startsWith(AUTH_PREFIX);
}
