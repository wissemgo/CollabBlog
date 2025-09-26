/**
 * Admin controller for managing users and roles
 */

import { Request, Response } from 'express';
import { catchAsync, createError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import User from '../models/User';
import { UserRole } from '../types';

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as UserRole;
  const status = req.query.status as 'active' | 'inactive';
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  const filter: any = {};
  
  if (role) {
    filter.role = role;
  }
  
  if (status) {
    filter.isActive = status === 'active';
  }
  
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select('-password -refreshTokens');

  const total = await User.countDocuments(filter);

  res.status(200).json({
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
  });
});

/**
 * Get user statistics for admin dashboard
 */
export const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const [totalUsers, activeUsers, userRoles] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const stats = {
    totalUsers,
    activeUsers,
    roles: userRoles.reduce((acc, role) => {
      acc[role._id] = role.count;
      return acc;
    }, {} as Record<UserRole, number>)
  };

  res.status(200).json({
    success: true,
    message: 'User statistics retrieved successfully',
    data: { stats }
  });
});

/**
 * Update user role
 */
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
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

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  });
});

/**
 * Update user status (activate/deactivate)
 */
export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user }
  });
});

/**
 * Create a new user (admin only)
 */
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  // Validation
  if (!username || !email || !password || !role) {
    throw createError('Please provide all required fields', 400);
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
    role
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    }
  });
});

/**
 * Delete user (admin only)
 */
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent admin users from deleting themselves
  if (req.user!._id.toString() === id) {
    throw createError('You cannot delete yourself', 400);
  }

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});
