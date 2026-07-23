import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../db.js';
import { AppError } from '../utils/errors.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

// Schemas
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Helper to set HttpOnly cookies
const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper to clear cookies
const clearTokenCookies = (res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 400);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt,
        userId: user.id,
      },
    });

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Get refresh token from cookie
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      token = cookies['refresh_token'];
    }

    // 2. Fallback to request body
    if (!token) {
      token = req.body?.refreshToken;
    }

    if (!token) {
      throw new AppError('Unauthorized: Refresh token is missing', 401);
    }

    // Verify token structure & expiry
    const payload = verifyRefreshToken(token);

    // Check DB for token existence and validity
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      // Clean up if expired
      if (dbToken) {
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      }
      throw new AppError('Unauthorized: Session expired or invalid refresh token', 401);
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(dbToken.userId);
    const newRefreshToken = generateRefreshToken(dbToken.userId);

    // Delete old refresh token & save new one
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: dbToken.id } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: dbToken.userId,
        },
      }),
    ]);

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  } catch (error) {
    // Clear cookies on failure to prevent continuous retry loop
    clearTokenCookies(res);
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from cookie
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      token = cookies['refresh_token'];
    }

    // Fallback to body
    if (!token) {
      token = req.body?.refreshToken;
    }

    if (token) {
      // Remove from DB (ignore error if not found)
      await prisma.refreshToken.delete({ where: { token } }).catch(() => {});
    }

    clearTokenCookies(res);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};
