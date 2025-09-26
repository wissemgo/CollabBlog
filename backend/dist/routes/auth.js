"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const User_1 = __importDefault(require("../models/User"));
const types_1 = require("../types");
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
router.post('/register', (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if (!username || !email || !password || !confirmPassword) {
        throw (0, errorHandler_1.createError)('Please provide all required fields', 400);
    }
    if (password !== confirmPassword) {
        throw (0, errorHandler_1.createError)('Passwords do not match', 400);
    }
    if (password.length < 8) {
        throw (0, errorHandler_1.createError)('Password must be at least 8 characters long', 400);
    }
    const existingUser = await User_1.default.findOne({
        $or: [{ email: email.toLowerCase() }, { username }]
    });
    if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
            throw (0, errorHandler_1.createError)('Email already registered', 409);
        }
        if (existingUser.username === username) {
            throw (0, errorHandler_1.createError)('Username already taken', 409);
        }
    }
    const newUser = await User_1.default.create({
        username,
        email: email.toLowerCase(),
        password,
        role: types_1.UserRole.READER
    });
    const tokenPayload = (0, jwt_1.createJWTPayload)({
        _id: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role
    });
    const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
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
router.post('/login', (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw (0, errorHandler_1.createError)('Please provide email and password', 400);
    }
    const user = await User_1.default.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw (0, errorHandler_1.createError)('Invalid email or password', 401);
    }
    user.lastLogin = new Date();
    await user.save();
    const tokenPayload = (0, jwt_1.createJWTPayload)({
        _id: user._id.toString(),
        email: user.email,
        role: user.role
    });
    const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
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
router.post('/refresh', (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw (0, errorHandler_1.createError)('Refresh token is required', 400);
    }
    try {
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            throw (0, errorHandler_1.createError)('User not found', 404);
        }
        const tokenPayload = (0, jwt_1.createJWTPayload)({
            _id: user._id.toString(),
            email: user.email,
            role: user.role
        });
        const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
        const response = {
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Invalid or expired refresh token', 401);
    }
}));
router.post('/logout', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const response = {
        success: true,
        message: 'Logout successful'
    };
    res.status(200).json(response);
}));
router.get('/me', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const response = {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
            user: {
                _id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                avatar: req.user.avatar,
                bio: req.user.bio,
                isEmailVerified: req.user.isEmailVerified,
                lastLogin: req.user.lastLogin,
                createdAt: req.user.createdAt
            }
        }
    };
    res.status(200).json(response);
}));
router.put('/change-password', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
        throw (0, errorHandler_1.createError)('Please provide all required fields', 400);
    }
    if (newPassword !== confirmPassword) {
        throw (0, errorHandler_1.createError)('New passwords do not match', 400);
    }
    if (newPassword.length < 8) {
        throw (0, errorHandler_1.createError)('New password must be at least 8 characters long', 400);
    }
    const user = await User_1.default.findById(req.user._id).select('+password');
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    if (!(await user.comparePassword(currentPassword))) {
        throw (0, errorHandler_1.createError)('Current password is incorrect', 401);
    }
    user.password = newPassword;
    await user.save();
    const response = {
        success: true,
        message: 'Password changed successfully'
    };
    res.status(200).json(response);
}));
exports.default = router;
//# sourceMappingURL=auth.js.map