"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateLimit = exports.optionalAuth = exports.canDeleteResource = exports.canEditResource = exports.authorize = exports.authenticate = void 0;
const User_1 = __importDefault(require("../models/User"));
const types_1 = require("../types");
const errorHandler_1 = require("./errorHandler");
const jwt_1 = require("../utils/jwt");
exports.authenticate = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
    if (!token) {
        return next((0, errorHandler_1.createError)('You are not logged in! Please log in to get access.', 401));
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        const currentUser = await User_1.default.findById(decoded.userId);
        if (!currentUser) {
            return next((0, errorHandler_1.createError)('The user belonging to this token does no longer exist.', 401));
        }
        req.user = currentUser;
        next();
    }
    catch (error) {
        return next((0, errorHandler_1.createError)('Invalid token. Please log in again!', 401));
    }
});
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next((0, errorHandler_1.createError)('You are not logged in!', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next((0, errorHandler_1.createError)('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.authorize = authorize;
const canEditResource = (resourceOwnerId) => {
    return (req, res, next) => {
        if (!req.user) {
            return next((0, errorHandler_1.createError)('You are not logged in!', 401));
        }
        if (req.user.role === types_1.UserRole.ADMIN || req.user.role === types_1.UserRole.EDITOR) {
            return next();
        }
        if (req.user._id.toString() === resourceOwnerId) {
            return next();
        }
        return next((0, errorHandler_1.createError)('You do not have permission to edit this resource', 403));
    };
};
exports.canEditResource = canEditResource;
const canDeleteResource = (resourceOwnerId) => {
    return (req, res, next) => {
        if (!req.user) {
            return next((0, errorHandler_1.createError)('You are not logged in!', 401));
        }
        if (req.user.role === types_1.UserRole.ADMIN) {
            return next();
        }
        if (req.user._id.toString() === resourceOwnerId && req.user.role !== types_1.UserRole.READER) {
            return next();
        }
        return next((0, errorHandler_1.createError)('You do not have permission to delete this resource', 403));
    };
};
exports.canDeleteResource = canDeleteResource;
exports.optionalAuth = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
    if (token) {
        try {
            const decoded = (0, jwt_1.verifyToken)(token);
            const currentUser = await User_1.default.findById(decoded.userId);
            if (currentUser) {
                req.user = currentUser;
            }
        }
        catch (error) {
        }
    }
    next();
});
const userRateLimit = (maxRequests, windowMs) => {
    const requests = new Map();
    return (req, res, next) => {
        const userId = req.user?._id?.toString() || req.ip || 'anonymous';
        const now = Date.now();
        const userRequests = requests.get(userId);
        if (!userRequests || now > userRequests.resetTime) {
            requests.set(userId, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (userRequests.count >= maxRequests) {
            return next((0, errorHandler_1.createError)(`Too many requests. Try again in ${Math.ceil((userRequests.resetTime - now) / 1000)} seconds.`, 429));
        }
        userRequests.count++;
        next();
    };
};
exports.userRateLimit = userRateLimit;
//# sourceMappingURL=auth.js.map