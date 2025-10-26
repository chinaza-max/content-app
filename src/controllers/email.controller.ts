import { Request, Response } from 'express';
import { EmailTemplateService } from '../services/email-template.service';
import { ResponseUtil } from '../utils/response.util';

export class EmailController {
  /**
   * Get email statistics
   */
  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await EmailTemplateService.getEmailStats();
      return ResponseUtil.success(res, 'Email statistics retrieved', stats);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  /**
   * Get failed emails
   */
  static async getFailedEmails(req: Request, res: Response): Promise<Response> {
    try {
      const limit = Number(req.query.limit) || 50;
      const failedEmails = await EmailTemplateService.getFailedEmails(limit);
      return ResponseUtil.success(res, 'Failed emails retrieved', failedEmails);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  /**
   * Retry failed emails
   */
  static async retryFailed(req: Request, res: Response): Promise<Response> {
    try {
      const maxAttempts = Number(req.body.maxAttempts) || 3;
      await EmailTemplateService.retryFailedEmails(maxAttempts);
      return ResponseUtil.success(res, 'Retry process initiated');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }
}