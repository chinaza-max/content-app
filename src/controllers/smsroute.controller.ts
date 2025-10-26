import { Request, Response } from 'express';
import SMSRouteService from '../services/smsroute.service';
import {ResponseUtil} from '../utils/response.util';

import { createSMSRouteSchema, sendTestSchema} from '../validators/sms.validation';

export default class SMSRouteController {
  static async create(req: any, res: Response) {
    try {
         const { error } = createSMSRouteSchema.validate(req.body);
      
      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const route = await SMSRouteService.createRoute(req.user.id, req.body);

  
      return ResponseUtil.success(res, 'SMS route created', route);
    } catch (error: any) {

      console.log(error)
      return ResponseUtil.error(res, error.message, 400);
      
    }
  }

  static async sendTest(req: any, res: Response) {
    try {
      const { routeId } = req.params;
      const result = await SMSRouteService.sendMessage(Number(routeId), req.body);
      return ResponseUtil.success(res, 'Message sent', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static async webhook(req: Request, res: Response) {
    try {
      const { routeId } = req.params;
      const result = await SMSRouteService.handleWebhook(Number(routeId), req.body);
      return ResponseUtil.success(res, 'Webhook received', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}
