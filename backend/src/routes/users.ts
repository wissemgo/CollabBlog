/**
 * User management routes
 */

import express from 'express';
import { Request, Response } from 'express';
import { catchAsync, createError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import User from '../models/User';
import { UserRole } from '../types';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, editor, writer, reader]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as UserRole;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (role) {
    filter.role = role;
  }

  const users = await User.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select('-password -refreshTokens');

  const total = await User.countDocuments(filter);

  const response = {
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticate, catchAsync(async (req: Request, res: Response) => {
  const { username, bio, avatar } = req.body;
  
  const updateData: any = {};
  if (username) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (avatar) updateData.avatar = avatar;

  // Check if username is already taken
  if (username && username !== req.user!.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw createError('Username already taken', 409);
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user!._id,
    updateData,
    { new: true, runValidators: true }
  );

  const response = {
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, editor, writer, reader]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.put('/:id/role', authenticate, authorize(UserRole.ADMIN), catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!Object.values(UserRole).includes(role)) {
    throw createError('Invalid role provided', 400);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw createError('User not found', 404);
  }

  const response = {
    success: true,
    message: 'User role updated successfully',
    data: {
      user
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select('-password -refreshTokens -email')
    .populate('articlesCount');

  if (!user) {
    throw createError('User not found', 404);
  }

  const response = {
    success: true,
    message: 'User retrieved successfully',
    data: {
      user
    }
  };

  res.status(200).json(response);
}));

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/stats', authenticate, authorize(UserRole.ADMIN), catchAsync(async (req: Request, res: Response) => {
  const stats = await (User as any).getStatistics();

  const response = {
    success: true,
    message: 'User statistics retrieved successfully',
    data: {
      stats
    }
  };

  res.status(200).json(response);
}));

export default router;