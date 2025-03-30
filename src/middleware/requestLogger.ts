import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent') || 'unknown',
      })
    );
  });

  next();
}
