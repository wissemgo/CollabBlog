/**
 * Authentication routes
 */

import express from 'express';
import { Request, Response } from 'express';
import { catchAsync, createError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import User from '../models/User';
import { UserRole } from '../types';
import { generateTokenPair, verifyRefreshToken, createJWTPayload } from '../utils/jwt';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 */
router.post('/register', catchAsync(async (req: Request, res: Response) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validation
  if (!username || !email || !password || !confirmPassword) {
    throw createError('Please provide all required fields', 400);
  }

  if (password !== confirmPassword) {
    throw createError('Passwords do not match', 400);
  }

  if (password.length < 8) {
    throw createError('Password must be at least 8 characters long', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw createError('Email already registered', 409);
    }
    if (existingUser.username === username) {
      throw createError('Username already taken', 409);
    }
  }

  // Create new user
  const newUser = await User.create({
    username,
    email: email.toLowerCase(),
    password,
    role: UserRole.READER
  });

  // Generate JWT tokens
  const tokenPayload = createJWTPayload({
    _id: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role
  });
  const tokens = generateTokenPair(tokenPayload);

  const response = {
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  };

  res.status(201).json(response);
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw createError('Please provide email and password', 400);
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw createError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT tokens
  const tokenPayload = createJWTPayload({
    _id: user._id.toString(),
    email: user.email,
    role: user.role
  });
  const tokens = generateTokenPair(tokenPayload);

  const response = {
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if user still exists
    const user = await User.findById(decoded._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Generate new token pair
    const tokenPayload = createJWTPayload({
      _id: user._id.toString(),
      email: user.email,
      role: user.role
    });
    const tokens = generateTokenPair(tokenPayload);

    const response = {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    };

    res.status(200).json(response);
  } catch (error) {
    throw createError('Invalid or expired refresh token', 401);
  }
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authenticate, catchAsync(async (req: Request, res: Response) => {
  // TODO: Implement logout logic (invalidate refresh token)
  
  const response = {
    success: true,
    message: 'Logout successful'
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, catchAsync(async (req: Request, res: Response) => {
  const response = {
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: {
        _id: req.user!._id,
        username: req.user!.username,
        email: req.user!.email,
        role: req.user!.role,
        avatar: req.user!.avatar,
        bio: req.user!.bio,
        isEmailVerified: req.user!.isEmailVerified,
        lastLogin: req.user!.lastLogin,
        createdAt: req.user!.createdAt
      }
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Invalid current password
 *       400:
 *         description: Invalid input data
 */
router.put('/change-password', authenticate, catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw createError('Please provide all required fields', 400);
  }

  if (newPassword !== confirmPassword) {
    throw createError('New passwords do not match', 400);
  }

  if (newPassword.length < 8) {
    throw createError('New password must be at least 8 characters long', 400);
  }

  // Get user with password
  const user = await User.findById(req.user!._id).select('+password');
  
  if (!user) {
    throw createError('User not found', 404);
  }

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    throw createError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  const response = {
    success: true,
    message: 'Password changed successfully'
  };

  res.status(200).json(response);
}));

export default router;