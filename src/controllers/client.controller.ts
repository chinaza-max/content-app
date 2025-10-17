import { Request, Response } from 'express';
import { ClientService } from '../services/client.service';
import { ResponseUtil } from '../utils/response.util';
import { clientSignupSchema, clientLoginSchema, verifyOtpSchema } from '../validators/client.validator';

export class ClientController {
  static renderSignup(req: Request, res: Response): void {
    res.render('signup', { error: null });
  }

  static renderLogin(req: Request, res: Response): void {
    res.render('login', { error: null });
  }

  static async signup(req: Request, res: Response): Promise<Response> {
    try {
      const { error, value } = clientSignupSchema.validate(req.body);

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const { email, password, firstName, lastName } = value;
      await ClientService.signup(email, password, firstName, lastName);

      return ResponseUtil.success(res, 'Signup successful. Please check your email for OTP.', null, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static async verifyOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { error, value } = verifyOtpSchema.validate(req.body);

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const { email, otp } = value;
      const token = await ClientService.verifyOTP(email, otp);

      res.cookie('client_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseUtil.success(res, 'Email verified successfully', { token });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { error, value } = clientLoginSchema.validate(req.body);

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const { email, password } = value;
      const token = await ClientService.login(email, password);

      res.cookie('client_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseUtil.success(res, 'Login successful', { token });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 401);
    }
  }

  static async resendOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return ResponseUtil.error(res, 'Email is required', 400);
      }

      await ClientService.sendVerificationOTP(email);
      return ResponseUtil.success(res, 'OTP sent successfully');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static logout(req: Request, res: Response): Response {
    res.clearCookie('client_token');
    return ResponseUtil.success(res, 'Logout successful');
  }
}