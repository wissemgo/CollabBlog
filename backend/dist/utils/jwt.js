"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJWTPayload = exports.isTokenExpired = exports.getTokenExpiration = exports.hasPermission = exports.extractTokenFromHeader = exports.generateTokenPair = exports.verifyRefreshToken = exports.verifyToken = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign({
        userId: payload.userId,
        email: payload.email,
        role: payload.role
    }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
        issuer: 'collab-blog',
        audience: 'collab-blog-users'
    });
};
exports.generateToken = generateToken;
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign({
        userId: payload.userId,
        email: payload.email,
        role: payload.role
    }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRE,
        issuer: 'collab-blog',
        audience: 'collab-blog-users'
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'collab-blog',
            audience: 'collab-blog-users'
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token has expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        else {
            throw new Error('Token verification failed');
        }
    }
};
exports.verifyToken = verifyToken;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'collab-blog',
            audience: 'collab-blog-users'
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Refresh token has expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        else {
            throw new Error('Refresh token verification failed');
        }
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const generateTokenPair = (payload) => {
    const accessToken = (0, exports.generateToken)(payload);
    const refreshToken = (0, exports.generateRefreshToken)(payload);
    return {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRE
    };
};
exports.generateTokenPair = generateTokenPair;
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1] || null;
};
exports.extractTokenFromHeader = extractTokenFromHeader;
const hasPermission = (userRole, requiredRole) => {
    const roleHierarchy = {
        [types_1.UserRole.READER]: 1,
        [types_1.UserRole.WRITER]: 2,
        [types_1.UserRole.EDITOR]: 3,
        [types_1.UserRole.ADMIN]: 4
    };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
exports.hasPermission = hasPermission;
const getTokenExpiration = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp)
            return null;
        return new Date(decoded.exp * 1000);
    }
    catch (error) {
        return null;
    }
};
exports.getTokenExpiration = getTokenExpiration;
const isTokenExpired = (token) => {
    const expDate = (0, exports.getTokenExpiration)(token);
    if (!expDate)
        return true;
    return expDate.getTime() <= Date.now();
};
exports.isTokenExpired = isTokenExpired;
const createJWTPayload = (user) => {
    return {
        userId: user._id,
        email: user.email,
        role: user.role
    };
};
exports.createJWTPayload = createJWTPayload;
//# sourceMappingURL=jwt.js.map