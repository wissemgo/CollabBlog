import { UserRole } from '../types';
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export declare const generateToken: (payload: {
    userId: string;
    email: string;
    role: UserRole;
}) => string;
export declare const generateRefreshToken: (payload: {
    userId: string;
    email: string;
    role: UserRole;
}) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const verifyRefreshToken: (token: string) => JWTPayload;
export declare const generateTokenPair: (payload: {
    userId: string;
    email: string;
    role: UserRole;
}) => {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
};
export declare const extractTokenFromHeader: (authHeader?: string) => string | null;
export declare const hasPermission: (userRole: UserRole, requiredRole: UserRole) => boolean;
export declare const getTokenExpiration: (token: string) => Date | null;
export declare const isTokenExpired: (token: string) => boolean;
export declare const createJWTPayload: (user: {
    _id: string;
    email: string;
    role: UserRole;
}) => {
    userId: string;
    email: string;
    role: UserRole;
};
//# sourceMappingURL=jwt.d.ts.map