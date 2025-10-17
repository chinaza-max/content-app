import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): Response => {
  console.error('Error:', err);
  return ResponseUtil.error(res, 'Internal server error', 500, err.message);
};
