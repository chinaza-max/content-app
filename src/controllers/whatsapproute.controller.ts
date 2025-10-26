import { Request, Response } from 'express';
import WhatsAppRouteService from '../services/whatsapproute.service';
import { ResponseUtil } from '../utils/response.util';
import { whatsappRouteSchema } from '../validators/whatsapproute.validation';

export default class WhatsAppRouteController {
  static async create(req: any, res: Response) {
    try {
      const { error, value } = whatsappRouteSchema.validate(req.body);
      if (error) return ResponseUtil.error(res, error.details[0].message, 400);

      const route = await WhatsAppRouteService.createRoute(req.user.id, value);
      return ResponseUtil.success(res, 'WhatsApp route created', route);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static async sendTest(req: any, res: Response) {
    try {
      const { routeId } = req.params;
      const result = await WhatsAppRouteService.sendMessage(Number(routeId), req.body);
      return ResponseUtil.success(res, 'Test message sent', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static async webhook(req: Request, res: Response) {
    try {
      const { routeId } = req.params;
      const result = await WhatsAppRouteService.handleWebhook(Number(routeId), req.body);
      return ResponseUtil.success(res, 'Webhook received', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}
