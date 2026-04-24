import { randomBytes } from 'crypto';

export function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}
