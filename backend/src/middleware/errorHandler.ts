/**
 * Error handling middleware for the application
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose Cast Error
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle Mongoose Duplicate Field Error
const handleDuplicateFieldsDB = (err: any): AppError => {
  const field = Object.keys(err.keyValue)[0];
  if (!field) {
    return new AppError('Duplicate field error', 400);
  }
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists. Please use another value.`;
  return new AppError(message, 400);
};

// Handle Mongoose Validation Error
const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT Error
const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again!', 401);

// Handle JWT Expired Error
const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error in development
const sendErrorDev = (err: ApiError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      status: err.statusCode,
      message: err.message,
      stack: err.stack,
      name: err.name
    }
  });
};

// Send error in production
const sendErrorProd = (err: ApiError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Handle 404 errors for undefined routes
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(error);
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Create custom error
export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

export { AppError };