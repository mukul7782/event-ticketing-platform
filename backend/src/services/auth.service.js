const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const { env } = require('../config/env');
const { AppError } = require('../utils/appError');

class AuthService {
  async register({ email, password, name, role }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppError.conflict('Email address already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, tokens };
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async generateTokens(userId, role) {
    const accessToken = jwt.sign(
      { sub: userId, role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRATION }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw AppError.badRequest('Refresh token is required');
    }

    let payload;
    try {
      payload = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: incomingRefreshToken },
    });

    if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
      // Replay detection: revoke all sessions for this user family
      await prisma.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { revoked: true },
      });
      throw AppError.forbidden('Security Alert: Reused or invalid refresh token. All sessions revoked.');
    }

    // Revoke previous token and rotate
    await prisma.refreshToken.update({
      where: { token: incomingRefreshToken },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw AppError.unauthorized('User no longer exists');
    }

    return this.generateTokens(user.id, user.role);
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { revoked: true },
      });
    }
    return true;
  }
}

module.exports = { AuthService };