import { Request, Response } from 'express';
import WhatsAppRouteService from '../services/whatsapproute.service';
import { ResponseUtil } from '../utils/response.util';
import { createWhatsAppCredentialSchema, createWhatsAppRouteSchema, updateWhatsAppCredentialSchema } from '../validators/whatsapproute.validation';

export default class WhatsAppRouteController {


    static async  create(req: Request, res: Response) {
    try {
      const { error, value } = createWhatsAppRouteSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const route = await WhatsAppRouteService.createRoute(value);
      res.status(201).json({ message: 'WhatsApp route created successfully', data: route });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async updateWhatsAppCredential(req: Request, res: Response) {
  try {
    const { error, value } = updateWhatsAppCredentialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const credential = await WhatsAppRouteService.updateCredential(
      req.params.id,
      value
    );

    if (!credential) {
      return res.status(404).json({ message: "Credential not found" });
    }

    return res.status(200).json({
      message: 'WhatsApp credential updated successfully',
      data: credential,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}


  static async createWhatsAppCredential(req: Request, res: Response){
  try {
    const { error, value } = createWhatsAppCredentialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const credential = await WhatsAppRouteService.createCredential(value);
    return res.status(201).json({
      message: 'WhatsApp credential created successfully',
      data: credential,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

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


  /*
    const mode = req.query['hub.mode']
  const challenge = req.query['hub.challenge']
  const token = req.query['hub.verify_token']

  if (mode && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
  */

  static async dynamicWebhook(req: Request, res: Response) {const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];
  const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK
  if (mode && token === WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);}

}
