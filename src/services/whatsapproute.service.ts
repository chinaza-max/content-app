import WhatsAppRoute from '../models/whatsapproute.model';
import { encryptData, decryptData } from '../utils/crypto.util';
import Message from '../models/message.model';
import axios from 'axios';
import mustache from 'mustache';
import {IRouteResponse} from '../interfaces/whatsapproute.interface';

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'super-secret-key';

export default class WhatsAppRouteService {
  /**
   * Create a new WhatsApp route.
   * Each route belongs to a client and a channel.
   */
  static async createRoute(clientId: number, body: any) {
    const {
      channelId, // ✅ required field
      provider,
      name,
      credentials,
      requestUrlTemplate,
      requestMethod,
      headersTemplate,
      bodyTemplate,
      contentType,
      paramMapping,
      successMatch,
      webhookPath,
      webhookSecretHash,
      senderName,
      isDefault,
    } = body;

    if (!channelId) {
      throw new Error('channelId is required to create a WhatsApp route');
    }

    const encryptedConfig = credentials
      ? encryptData(JSON.stringify(credentials), ENCRYPTION_KEY)
      : null;

    const route = await WhatsAppRoute.create({
      clientId,
      channelId, // ✅ added here
      provider,
      name,
      encryptedConfig,
      requestUrlTemplate,
      requestMethod,
      headersTemplate,
      bodyTemplate,
      contentType,
      paramMapping,
      successMatch,
      webhookPath,
      webhookSecretHash,
      senderName,
      isDefault,
      forType:"content"
    });

    return route;
  }

  /**
   * Send a test message through the WhatsApp route.
   */
  static async sendMessage(routeId: number, payload: any) {
    const route = await WhatsAppRoute.findByPk(routeId);
    if (!route) throw new Error('Route not found');

    const config = route.encryptedConfig
      ? JSON.parse(decryptData(route.encryptedConfig, ENCRYPTION_KEY))
      : {};

    // Build message context for Mustache templating
    const ctx = {
      ...config,
      to: payload.to,
      text: payload.text,
      from: payload.from || route.senderName || config.phoneNumber,
      urlEncode() {
        return (text: string, render: (v: string) => string) =>
          encodeURIComponent(render(text));
      },
    };

    const url = mustache.render(route.requestUrlTemplate || '', ctx);
    const headers = route.headersTemplate
      ? JSON.parse(mustache.render(route.headersTemplate, ctx))
      : {};
    const bodyStr = route.bodyTemplate
      ? mustache.render(route.bodyTemplate, ctx)
      : undefined;

    const axiosConfig: any = {
      url,
      method: route.requestMethod,
      headers,
      timeout: 15000,
      data:
        route.contentType === 'application/json'
          ? JSON.parse(bodyStr || '{}')
          : bodyStr,
    };

    const res = await axios(axiosConfig);

const response: IRouteResponse = res.data || {};

/*
// Save message log
await Message.create({
  clientId: route.clientId,
  channelId: route.channelId,
  direction: 'outbound',
  type: payload.type || 'direct',
  content: payload.text,
  deliveryMethod: 'whatsapp',
  status: response.success ? 'delivered' : 'failed',
  sentCount: response.success ? 1 : 0,
  failedCount: response.success ? 0 : 1,
  metadata: { response },
});
*/

    return { success: response.success, response };
  }

  /**
   * Handle webhook (incoming WhatsApp messages)
   */
  static async handleWebhook(routeId: number, payload: any) {
    // Handle incoming message processing
    return payload;
  }
}
