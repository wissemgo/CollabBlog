/**
 * User Model - MongoDB Schema for user authentication and management
 */

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  refreshTokens: string[];
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string): void;
  removeRefreshToken(token: string): void;
  hasPermission(requiredRole: UserRole): boolean;
}

/**\n * @swagger\n * components:\n *   schemas:\n *     User:\n *       type: object\n *       required:\n *         - username\n *         - email\n *         - password\n *       properties:\n *         _id:\n *           type: string\n *           description: Unique identifier for the user\n *         username:\n *           type: string\n *           description: Unique username (3-30 characters)\n *           minLength: 3\n *           maxLength: 30\n *         email:\n *           type: string\n *           format: email\n *           description: User's email address\n *         role:\n *           type: string\n *           enum: [admin, editor, writer, reader]\n *           description: User's role in the system\n *         avatar:\n *           type: string\n *           description: URL to user's profile picture\n *         bio:\n *           type: string\n *           maxLength: 500\n *           description: User's biography\n *         isEmailVerified:\n *           type: boolean\n *           description: Whether the user's email is verified\n *         lastLogin:\n *           type: string\n *           format: date-time\n *           description: Last login timestamp\n *         createdAt:\n *           type: string\n *           format: date-time\n *           description: Account creation timestamp\n *         updatedAt:\n *           type: string\n *           format: date-time\n *           description: Last update timestamp\n */

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minLength: [3, 'Username must be at least 3 characters'],
      maxLength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [8, 'Password must be at least 8 characters'],
      select: false // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.READER,
      required: true
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxLength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false // Don't include refresh tokens in queries
    },
    lastLogin: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete (ret as any).password;
        delete (ret as any).refreshTokens;
        delete (ret as any).__v;
        return ret;
      }
    },
    toObject: {
      transform: function(doc, ret) {
        delete (ret as any).password;
        delete (ret as any).refreshTokens;
        delete (ret as any).__v;
        return ret;
      }
    }
  }
);

// Indexes for better query performance

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function(token: string): void {
  this.refreshTokens.push(token);
  
  // Keep only the last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function(token: string): void {
  this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
};

// Instance method to check permissions
userSchema.methods.hasPermission = function(requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.READER]: 1,
    [UserRole.WRITER]: 2,
    [UserRole.EDITOR]: 3,
    [UserRole.ADMIN]: 4
  };
  
  return (roleHierarchy as any)[this.role] >= (roleHierarchy as any)[requiredRole];
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password +refreshTokens');
};

// Static method to get user statistics
userSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: '$count' },
        roleDistribution: {
          $push: {
            role: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);
  
  return stats[0] || { totalUsers: 0, roleDistribution: [] };
};

// Virtual for user's full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/api/users/${this._id}`;
});

// Virtual for user's articles count (will be populated when needed)
userSchema.virtual('articlesCount', {
  ref: 'Article',
  localField: '_id',
  foreignField: 'author',
  count: true
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;