/**
 * JWT Authentication utilities
 */

import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

export interface JWTPayload {
  _id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 */
export const generateToken = (payload: { _id: string; email: string; role: UserRole }): string => {
  return jwt.sign(
    {
      _id: payload._id,
      email: payload.email,
      role: payload.role
    },
    JWT_SECRET as string,
    {
      expiresIn: JWT_EXPIRE,
      issuer: 'collab-blog',
      audience: 'collab-blog-users'
    } as jwt.SignOptions
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: { _id: string; email: string; role: UserRole }): string => {
  return jwt.sign(
    {
      _id: payload._id,
      email: payload.email,
      role: payload.role
    },
    JWT_REFRESH_SECRET as string,
    {
      expiresIn: JWT_REFRESH_EXPIRE,
      issuer: 'collab-blog',
      audience: 'collab-blog-users'
    } as jwt.SignOptions
  );
};

/**
 * Verify JWT access token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'collab-blog',
      audience: 'collab-blog-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'collab-blog',
      audience: 'collab-blog-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (payload: { _id: string; email: string; role: UserRole }) => {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRE
  };
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

/**
 * Check if user has required role permission
 */
export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.READER]: 1,
    [UserRole.WRITER]: 2,
    [UserRole.EDITOR]: 3,
    [UserRole.ADMIN]: 4
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expDate = getTokenExpiration(token);
  if (!expDate) return true;
  
  return expDate.getTime() <= Date.now();
};

/**
 * Create JWT payload from user data
 */
export const createJWTPayload = (user: {
  _id: string;
  email: string;
  role: UserRole;
}): { _id: string; email: string; role: UserRole } => {
  return {
    _id: user._id,
    email: user.email,
    role: user.role
  };
};