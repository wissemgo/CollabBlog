"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const types_1 = require("../types");
const userSchema = new mongoose_1.Schema({
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
        select: false
    },
    role: {
        type: String,
        enum: Object.values(types_1.UserRole),
        default: types_1.UserRole.READER,
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
        select: false
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.__v;
            return ret;
        }
    }
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const saltRounds = 12;
        this.password = await bcryptjs_1.default.hash(this.password, saltRounds);
        next();
    }
    catch (error) {
        next(error);
    }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
userSchema.methods.addRefreshToken = function (token) {
    this.refreshTokens.push(token);
    if (this.refreshTokens.length > 5) {
        this.refreshTokens = this.refreshTokens.slice(-5);
    }
};
userSchema.methods.removeRefreshToken = function (token) {
    this.refreshTokens = this.refreshTokens.filter((t) => t !== token);
};
userSchema.methods.hasPermission = function (requiredRole) {
    const roleHierarchy = {
        [types_1.UserRole.READER]: 1,
        [types_1.UserRole.WRITER]: 2,
        [types_1.UserRole.EDITOR]: 3,
        [types_1.UserRole.ADMIN]: 4
    };
    return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};
userSchema.statics.findByEmailOrUsername = function (identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
        ]
    }).select('+password +refreshTokens');
};
userSchema.statics.getStatistics = async function () {
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
userSchema.virtual('profileUrl').get(function () {
    return `/api/users/${this._id}`;
});
userSchema.virtual('articlesCount', {
    ref: 'Article',
    localField: '_id',
    foreignField: 'author',
    count: true
});
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map