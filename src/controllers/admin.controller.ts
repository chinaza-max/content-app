import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { ResponseUtil } from '../utils/response.util';
import { adminLoginSchema } from '../validators/admin.validator';

export class AdminController {
  static renderLogin(req: Request, res: Response): void {
    res.render('admin-login', { error: null });
  }

  static async login(req: Request, res: Response): Promise<Response | void> {
    try {
      
      const { error, value } = adminLoginSchema.validate(req.body);

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const { email, password } = value;
      const token = await AdminService.login(email, password);

      res.cookie('admin_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseUtil.success(res, 'Login successful', { token });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 401);
    }
  }

  static logout(req: Request, res: Response): Response {
    res.clearCookie('admin_token');
    return ResponseUtil.success(res, 'Logout successful');
  }
}