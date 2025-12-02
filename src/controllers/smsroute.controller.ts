import { Request, Response } from 'express';
import SMSRouteService from '../services/smsroute.service';
import {ResponseUtil} from '../utils/response.util';
import { AuthRequest } from '../types';

import { createSMSRouteSchema, getRouteSchema, getWebhookInfoSchema, sendTestSchema} from '../validators/sms.validation';

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

static async getRoute(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const clientId = req.user?.id;
      const routeId = parseInt(req.params.id, 10);

      // ✅ Check authentication
      if (!clientId) {
        return ResponseUtil.error(res, 'Authentication required', 401);
      }

      // ✅ Validate routeId
      if (isNaN(routeId)) {
        return ResponseUtil.error(res, 'Invalid route ID', 400);
      }

      // ✅ Validate query params (optional, if schema exists)
      const { error } = getRouteSchema
        ? getRouteSchema.validate({
            includeCredentials: req.query.includeCredentials === 'true',
          })
        : { error: null };

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const includeCredentials = req.query.includeCredentials === 'true';

      // ✅ Fetch route details
      const route = await SMSRouteService.getRouteDetails(
        routeId,
        clientId,
        includeCredentials
      );

      if (!route) {
        return ResponseUtil.error(res, 'Route not found or access denied', 404);
      }

      // ✅ Success
      return ResponseUtil.success(res, 'Route fetched successfully', route);
    } catch (error: any) {
      console.error('❌ Error getting route:', error);

      if (error.message === 'Route not found or access denied') {
        return ResponseUtil.error(res, error.message, 404);
      }

      return ResponseUtil.error(res, error.message || 'Failed to get route', 500);
    }
  }


static async getWebhookInfo(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const clientId = req.user?.id;

    if (!clientId) {
      return ResponseUtil.error(res, 'Unauthorized: client ID missing', 401);
    }

    // ✅ 1️⃣ Validate params & query
    const { error, value } = getWebhookInfoSchema.validate({
      id: req.params.id,
      includeCredentials: req.query.includeCredentials === 'true',
    });

    if (error) {
      return ResponseUtil.error(res, error.details[0].message, 400);
    }

    const { id: routeId, includeCredentials } = value;

    // ✅ 2️⃣ Fetch route info
    const route = await SMSRouteService.getRouteDetails(
      Number(routeId),
      clientId,
      includeCredentials
    );

    // ✅ 3️⃣ Check webhook availability
    if (!route.webhookEnabled) {
      return ResponseUtil.error(res, 'Webhook not enabled for this route', 404);
    }

    // ✅ 4️⃣ Build response payload
    const responseData = {
      routeId: route.id,
      routeName: route.name,
      provider: route.provider,
      webhookEnabled: route.webhookEnabled,
      webhookUrl: route.webhookUrl,
      webhookPath: route.webhookPath,
      webhookConfig: route.webhook || null,
      instructions: {
        setup: [
          `1. Go to your ${route.provider} dashboard`,
          `2. Find the webhook/callback URL settings`,
          `3. Enter this URL: ${route.webhookUrl}`,
          `4. Save the configuration`,
          `5. Test by sending a message to your number`,
        ],
        incomingMessages: route.webhook?.incomingMessage?.enabled
          ? 'Enabled - You will receive incoming SMS'
          : 'Disabled',
        deliveryReports: route.webhook?.deliveryReport?.enabled
          ? 'Enabled - You will receive delivery status updates'
          : 'Disabled',
        security: route.webhook?.signatureValidation?.enabled
          ? `Enabled - Using ${route.webhook.signatureValidation.algorithm} validation`
          : 'No signature validation',
      },
    };

    // ✅ 5️⃣ Send final response
    return ResponseUtil.success(res, 'Webhook info fetched successfully', responseData);
  } catch (error: any) {
    console.error('❌ Error getting webhook info:', error);

    if (error.message === 'Route not found or access denied') {
      return ResponseUtil.error(res, error.message, 404);
    }

    return ResponseUtil.error(res, error.message || 'Failed to get webhook info', 500);
  }
}




  
}
