import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

describe('JWT Utilities', () => {
  const userId = 'user-uuid-1234';

  test('should generate and verify access tokens', () => {
    const token = generateAccessToken(userId);
    expect(typeof token).toBe('string');

    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe(userId);
  });

  test('should generate and verify refresh tokens', () => {
    const token = generateRefreshToken(userId);
    expect(typeof token).toBe('string');

    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe(userId);
  });
});
