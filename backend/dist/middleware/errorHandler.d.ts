import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
}
declare class AppError extends Error implements ApiError {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
export declare const catchAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: (message: string, statusCode: number) => AppError;
export { AppError };
//# sourceMappingURL=errorHandler.d.ts.map