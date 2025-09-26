import mongoose, { Document } from 'mongoose';
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
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    addRefreshToken(token: string): void;
    removeRefreshToken(token: string): void;
    hasPermission(requiredRole: UserRole): boolean;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=User.d.ts.map