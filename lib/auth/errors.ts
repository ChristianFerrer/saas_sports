type ErrorLike = { message?: string; status?: number; code?: string } | null | undefined;

type Mapped = { key?: string; fallback?: string };

// Maps a Supabase AuthError to a known i18n key under `auth.errors`, or
// returns `fallback` with the raw message so the user sees the real cause
// instead of a generic message.
export function mapAuthError(error: ErrorLike): Mapped {
  if (!error) return {};
  const message = error.message ?? '';
  const status = error.status;

  if (status === 429 || /rate.?limit|too many requests/i.test(message)) {
    return { key: 'rate_limit' };
  }
  if (/invalid.*credential|invalid.*password|invalid.*email.*password/i.test(message)) {
    return { key: 'invalid_credentials' };
  }
  if (/already registered|already exists|duplicate/i.test(message)) {
    return { key: 'email_taken' };
  }
  if (/password/i.test(message) && /(short|weak|length|characters)/i.test(message)) {
    return { key: 'weak_password' };
  }

  return { fallback: message || undefined };
}
