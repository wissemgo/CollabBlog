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
const router = express_1.default.Router();
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), (0, errorHandler_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role;
    const skip = (page - 1) * limit;
    const filter = {};
    if (role) {
        filter.role = role;
    }
    const users = await User_1.default.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-password -refreshTokens');
    const total = await User_1.default.countDocuments(filter);
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
router.put('/profile', auth_1.authenticate, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { username, bio, avatar } = req.body;
    const updateData = {};
    if (username)
        updateData.username = username;
    if (bio !== undefined)
        updateData.bio = bio;
    if (avatar)
        updateData.avatar = avatar;
    if (username && username !== req.user.username) {
        const existingUser = await User_1.default.findOne({ username });
        if (existingUser) {
            throw (0, errorHandler_1.createError)('Username already taken', 409);
        }
    }
    const updatedUser = await User_1.default.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    const response = {
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: updatedUser
        }
    };
    res.status(200).json(response);
}));
router.put('/:id/role', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!Object.values(types_1.UserRole).includes(role)) {
        throw (0, errorHandler_1.createError)('Invalid role provided', 400);
    }
    const user = await User_1.default.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
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
router.get('/:id', (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const user = await User_1.default.findById(id)
        .select('-password -refreshTokens -email')
        .populate('articlesCount');
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
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
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), (0, errorHandler_1.catchAsync)(async (req, res) => {
    const stats = await User_1.default.getStatistics();
    const response = {
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
            stats
        }
    };
    res.status(200).json(response);
}));
exports.default = router;
//# sourceMappingURL=users.js.map