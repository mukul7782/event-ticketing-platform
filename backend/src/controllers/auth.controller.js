const { AuthService } = require('../services/auth.service');
const { ResponseFormatter } = require('../utils/responseFormatter');
const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/appError');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      throw AppError.badRequest('Email, password, and name are required');
    }

    const result = await this.authService.register({ email, password, name, role });
    return ResponseFormatter.success(res, result, 'User registered successfully', 201);
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw AppError.badRequest('Email and password are required');
    }

    const result = await this.authService.login(email, password);
    return ResponseFormatter.success(res, result, 'Login successful', 200);
  });

  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw AppError.badRequest('Refresh token is required');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    return ResponseFormatter.success(res, { tokens }, 'Token refreshed successfully', 200);
  });

  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await this.authService.logout(req.user?.id, refreshToken);
    return ResponseFormatter.success(res, null, 'Logged out successfully', 200);
  });

  getProfile = asyncHandler(async (req, res) => {
    return ResponseFormatter.success(res, req.user, 'Current user profile', 200);
  });
}

module.exports = { AuthController };