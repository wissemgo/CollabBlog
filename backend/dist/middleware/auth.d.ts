import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { UserRole } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorize: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const canEditResource: (resourceOwnerId: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const canDeleteResource: (resourceOwnerId: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const userRateLimit: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map