import axios from 'axios';
import mustache from 'mustache';
import { decryptData, encryptData } from '../utils/crypto.util';
import { renderTemplate, evaluateSuccess } from '../utils/sms.utils';
import SMSRoute from '../models/smsroute.model';
import {Message , Client } from '../models/index';
import { randomBytes } from 'crypto';
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'super-secret-key';
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'https://yourdomain.com';
//import { EncryptedRouteConfig, WebhookConfiguration, RouteCredentials } from '../models/smsroute.model';

mustache.escape = (text: string) => text;

export default class SMSRouteService {

  /*
  static async createRoute(clientId: number, body: any) {
    const {
      provider,
      name,
      credentials,
      requestUrlTemplate,
      requestMethod,
      headersTemplate,
      bodyTemplate,
      contentType,
      successMatch,
      webhookPath,
      senderId,
      isDefault,
      forType,

    } = body;


    const user = await Client.findByPk(clientId);
    if (!user) {
      throw new Error('User not found');
    }



    const encryptedConfig = credentials
      ? encryptData(JSON.stringify(credentials), ENCRYPTION_KEY)
      : null;

    const route = await SMSRoute.create({
      clientId,
      provider,
      name,
      encryptedConfig,
      requestUrlTemplate,
      requestMethod,
      headersTemplate,
      bodyTemplate,
      contentType,
      successMatch,
      webhookPath,
      senderId,
      isDefault,
      forType
    });

    return route;
  }*/


static async createRoute(clientId: number, body: any): Promise<SMSRoute> {
    const {
      provider,
      name,
      credentials,
      requestUrlTemplate,
      requestMethod,
      headersTemplate,
      bodyTemplate,
      contentType,
      successMatch,
      senderId,
      isDefault,
      forType,
      webhook,
    } = body;

    // 1️⃣ Validate client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // 2️⃣ Check if route name already exists for this client
    const existingRoute = await SMSRoute.findOne({
      where: { clientId, name },
    });
    if (existingRoute) {
      throw new Error(`Route with name "${name}" already exists for this client`);
    }

    // 3️⃣ Generate unique webhook path if webhook is enabled
    let webhookPath: string | undefined;
    let webhookEnabled = false;

    if (webhook?.enabled) {
      webhookEnabled = true;
      
      // Use custom path or generate unique one
      if (webhook.customPath) {
        // Validate format
        if (!webhook.customPath.startsWith('/webhooks/')) {
          throw new Error('Webhook path must start with /webhooks/');
        }
        
        // Check if path is already taken
        const existingWebhook = await SMSRoute.findOne({
          where: { webhookPath: webhook.customPath },
        });
        if (existingWebhook) {
          throw new Error(`Webhook path "${webhook.customPath}" is already in use`);
        }
        
        webhookPath = webhook.customPath;
      } else {
        // Auto-generate unique webhook path
        webhookPath = await this.generateUniqueWebhookPath(provider);
      }
    }

    // 4️⃣ If setting as default, unset other default routes for this client
    if (isDefault) {
      await SMSRoute.update(
        { isDefault: false },
        { where: { clientId, isDefault: true } }
      );
    }

    // 5️⃣ Prepare encrypted config (credentials + webhook config)
    const configToEncrypt: any = {
      credentials: credentials || {},
      webhook: webhook || undefined,
    };

    const encryptedConfig = encryptData(
      JSON.stringify(configToEncrypt),
      ENCRYPTION_KEY
    );

    // 6️⃣ Create the route
    const route = await SMSRoute.create({
      clientId,
      provider,
      name,
      encryptedConfig,
      requestUrlTemplate,
      requestMethod: requestMethod || 'POST',
      headersTemplate,
      bodyTemplate,
      contentType,
      successMatch,
      webhookPath,
      webhookEnabled,
      senderId,
      isDefault: isDefault || false,
      status: 'active',
      forType: forType || 'content',
      pricePerSms: 0.01,
    });

    console.log(`✅ Route created: ${route.name} (ID: ${route.id})`);
    if (webhookPath) {
      console.log(`📥 Webhook URL: ${this.getWebhookUrl(route)}`);
    }

    return route;
  }

   static getWebhookUrl(route: SMSRoute): string {
    if (!route.webhookPath) return '';
    return `${WEBHOOK_BASE_URL}${route.webhookPath}`;
  }
  static async sendMessage(routeId: number, payload: any) {

    /*
    console.log('📨 [SMSRouteService] Sending message using route:', routeId);
    console.log('➡️ Payload:', payload);
*/
    // 1️⃣ Fetch the route
    const route = await SMSRoute.findByPk(routeId);
    if (!route) {
      console.error('❌ Route not found:', routeId);
      throw new Error('Route not found');
    }
  //  console.log('✅ Route found:', route.name);

    // 2️⃣ Decrypt credentials
    const config = route.encryptedConfig
      ? JSON.parse(decryptData(route.encryptedConfig, ENCRYPTION_KEY))
      : {};
   // console.log('🔐 Decrypted config keys:', Object.keys(config));

    // 3️⃣ Prepare render context
    const ctx = {
      ...config,
      to: payload.to,
      text: payload.text,
      //from:"AFRICASTKNG",
      //from: payload.from || route.senderId || config.senderId,
      // ✅ add Mustache lambda for URL encoding
      urlEncode() {
        return (text: string, render: (v: string) => string) =>
          encodeURIComponent(render(text));
      },
      basicAuthBase64: Buffer.from(
        `${config.accountSid || ''}:${config.authToken || ''}`
      ).toString('base64'),
    };

/*
    console.log('🧩 Render context (partial):', {
      to: ctx.to,
      from: ctx.from,
      provider: route.provider,
    });
    console.log(ctx)*/

    // 4️⃣ Render templates
    const url = mustache.render(route.requestUrlTemplate, ctx);
    const headers = route.headersTemplate
      ? JSON.parse(mustache.render(route.headersTemplate, ctx))
      : {};
    const bodyStr = route.bodyTemplate
      ? mustache.render(route.bodyTemplate, ctx)
      : undefined;

      /*
    console.log('🌍 URL:', url);
    console.log('🪶 Headers:', headers);
    console.log('📦 Body:', bodyStr);*/

    // 5️⃣ Axios config
    const axiosConfig: any = {
      url,
      method: route.requestMethod,
      headers,
      timeout: 15000,
    };

    if (route.requestMethod !== 'GET') {
      if ((route.contentType || '').includes('json')) {
        axiosConfig.data = bodyStr ? JSON.parse(bodyStr) : {};
      } else {
        axiosConfig.data = bodyStr;
      }
    }

    try {

/*
      // 👇 Added detailed logging before sending request
console.log('🚀 Sending request via Axios...');
console.log('🧾 Final Axios Payload:');
console.log(JSON.stringify({
  method: axiosConfig.method,
  url: axiosConfig.url,
  headers: axiosConfig.headers,
  data: axiosConfig.data,
}, null, 2));
      console.log('🚀 Sending request via Axios...');
*/


      const res = await axios(axiosConfig);
      const response = res.data;
   //   console.log('✅ Response received:', response);

      const success = evaluateSuccess(response, route.successMatch);
    //  console.log(`📊 Message delivery status: ${success ? 'Success' : 'Failed'}`);



      console.log('🧾 Message record saved successfully.');
      return { success, response };
    } catch (error: any) {
      console.error('💥 Error sending SMS:', error.message);
      if (error.response) {
        console.error('🧯 API Response Error:', error.response.data);
      }
      throw error;
    }
  }


  



  static async handleWebhook(routeId: number, body: any) {
    const route = await SMSRoute.findByPk(routeId);
    if (!route) throw new Error('Route not found');

    const { from, to, text } = body;

    /*
   await Message.create({
      clientId: route.clientId,
      direction: 'inbound', // ✅ inbound direction
      type: 'direct', // inbound messages are usually direct
      content: text,
      deliveryMethod: 'sms',
      status: 'delivered',
      sentCount: 0, // ✅ inbound = 0 sent count
      failedCount: 0,
      // subscriberId: subscriber?.id ?? null, // optional when linked to a subscriber
      metadata: body,
    });
*/
    

    return { received: true };
  }



    private static async generateUniqueWebhookPath(provider: string): Promise<string> {
    let webhookPath: string;
    let exists = true;

    while (exists) {
      const randomId = randomBytes(6).toString('hex');
      webhookPath = `/webhooks/${provider}-${randomId}`;

      const existing = await SMSRoute.findOne({ where: { webhookPath } });
      exists = !!existing;
    }

    return webhookPath!;
  }



  static async getRouteDetails(
    routeId: number,
    clientId: number,
    includeCredentials = false
  ): Promise<any> {
    const route = await SMSRoute.findOne({
      where: { id: routeId, clientId },
    });

    if (!route) throw new Error('Route not found or access denied');

    // ==================================================
    // 🧩 1️⃣ Handle decrypted config
    // ==================================================
    let decryptedConfig: any = {};
    if (route.encryptedConfig) {
      try {
        decryptedConfig = decryptData(route.encryptedConfig, ENCRYPTION_KEY);
        decryptedConfig = JSON.parse(decryptedConfig);
        console.log(route.encryptedConfig);
      } catch (err) {
        console.warn(`⚠️ Failed to decrypt config for route ${route.id}:`, err);
      }
    }

    const webhook = decryptedConfig.webhook || {};
    const credentials = decryptedConfig.credentials || {};

    // ==================================================
    // 🌍 2️⃣ Build webhook URL
    // ==================================================
    const baseUrl = process.env.BASE_URL || 'https://yourapp.com';
    const webhookPath = route.webhookPath || `/webhooks/sms/${route.provider}/${route.id}`;
    const webhookUrl = `${baseUrl}${webhookPath}`;

    // ==================================================
    // 📦 3️⃣ Response Object
    // ==================================================
    const response: any = {
      id: route.id,
      name: route.name,
      provider: route.provider,
      requestUrlTemplate: route.requestUrlTemplate,
      requestMethod: route.requestMethod,
      contentType: route.contentType,
      successMatch: route.successMatch,
      forType: route.forType,
      isDefault: route.isDefault,
      status: route.status,
      pricePerSms: route.pricePerSms,
      webhookEnabled: route.webhookEnabled || webhook?.enabled || false,
      webhookPath,
      webhookUrl,
      webhook,
    };

    if (includeCredentials) {
      response.credentials = credentials;
    }

    return response;
  }

}
//atsk_4d697ac636af11dd9c76e1cc12823571fe400b7f85227d38cba91adc91d91b604581a308
