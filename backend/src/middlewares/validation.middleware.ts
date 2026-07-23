import type { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';

export const validateRequest = (schema: z.ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.issues.map((err) => ({
            field: err.path.slice(1).join('.'), // removes 'body', 'query', or 'params' prefix
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
