import { Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { ResponseUtil } from '../utils/response.util';
import { AuthRequest } from '../types';

export class AuthMiddleware {
  static verifyAdmin(req: AuthRequest, res: Response, next: NextFunction): Response | void {
    const token = req.cookies.admin_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return ResponseUtil.error(res, 'Authentication required', 401);
    }

    const decoded = JwtUtil.verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return ResponseUtil.error(res, 'Invalid or expired token', 401);
    }

    req.user = decoded;
    next();
  }

  static verifyClient(req: AuthRequest, res: Response, next: NextFunction): Response | void {
    const token = req.cookies.client_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return ResponseUtil.error(res, 'Authentication required', 401);
    }

    const decoded = JwtUtil.verifyToken(token);

    if (!decoded || decoded.role !== 'client') {
      return ResponseUtil.error(res, 'Invalid or expired token', 401);
    }

    req.user = decoded;
    next();
  }
}