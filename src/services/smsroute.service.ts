import axios from 'axios';
import mustache from 'mustache';
import { decryptData, encryptData } from '../utils/crypto.util';
import { renderTemplate, evaluateSuccess } from '../utils/sms.utils';
import SMSRoute from '../models/smsroute.model';
import {Message , Client } from '../models/index';

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'super-secret-key';
mustache.escape = (text: string) => text;

export default class SMSRouteService {

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
      paramMapping,
      successMatch,
      webhookPath,
      webhookSecretHash,
      senderId,
      isDefault,
      forType
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
      paramMapping,
      successMatch,
      webhookPath,
      webhookSecretHash,
      senderId,
      isDefault,
      forType
    });

    return route;
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
}
//atsk_4d697ac636af11dd9c76e1cc12823571fe400b7f85227d38cba91adc91d91b604581a308
