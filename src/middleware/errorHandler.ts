import { Request, Response, NextFunction } from 'express';

export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Unhandled error:', error);

  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
}

export function uncaughtExceptionHandler() {
  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
  });
}
