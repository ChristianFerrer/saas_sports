import { describe, expect, it } from 'vitest';

import { generateInvitationToken } from './tokens';

describe('generateInvitationToken', () => {
  it('returns a non-empty string', () => {
    const t = generateInvitationToken();
    expect(typeof t).toBe('string');
    expect(t.length).toBeGreaterThan(0);
  });

  it('returns unique tokens across calls', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 1000; i += 1) tokens.add(generateInvitationToken());
    expect(tokens.size).toBe(1000);
  });

  it('uses url-safe base64 characters only', () => {
    const t = generateInvitationToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces tokens of sufficient entropy (at least 32 chars)', () => {
    const t = generateInvitationToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
  });
});
