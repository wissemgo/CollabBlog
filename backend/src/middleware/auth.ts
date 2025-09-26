/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { UserRole } from '../types';
import { createError, catchAsync } from './errorHandler';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Authentication middleware - protect routes
 */
export const authenticate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return next(createError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const currentUser = await User.findById(decoded._id);
    if (!currentUser) {
      return next(createError('The user belonging to this token does no longer exist.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return next(createError('Invalid token. Please log in again!', 401));
  }
});

/**
 * Authorization middleware - check user roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('You are not logged in!', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Check if user can edit specific resource
 */
export const canEditResource = (resourceOwnerId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('You are not logged in!', 401));
    }

    // Admin and Editor can edit any resource
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.EDITOR) {
      return next();
    }

    // Users can only edit their own resources
    if (req.user._id.toString() === resourceOwnerId) {
      return next();
    }

    return next(createError('You do not have permission to edit this resource', 403));
  };
};

/**
 * Check if user can delete specific resource
 */
export const canDeleteResource = (resourceOwnerId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('You are not logged in!', 401));
    }

    // Only Admin can delete any resource
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Users can only delete their own resources (except articles)
    if (req.user._id.toString() === resourceOwnerId && req.user.role !== UserRole.READER) {
      return next();
    }

    return next(createError('You do not have permission to delete this resource', 403));
  };
};

/**
 * Optional authentication - don't fail if no token
 */
export const optionalAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const decoded = verifyToken(token);
      const currentUser = await User.findById(decoded._id);
      if (currentUser) {
        req.user = currentUser;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
});

/**
 * Rate limiting per user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id?.toString() || req.ip || 'anonymous';
    const now = Date.now();
    
    const userRequests = requests.get(userId);
    
    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return next(createError(`Too many requests. Try again in ${Math.ceil((userRequests.resetTime - now) / 1000)} seconds.`, 429));
    }
    
    userRequests.count++;
    next();
  };
};