import WhatsAppRoute, { IWhatsAppRouteAttributes } from '../models/whatsapproute.model';
import { encryptData, decryptData } from '../utils/crypto.util';
import Message from '../models/message.model';
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

import mustache from 'mustache';
import WhatsAppCredential from '../models/whats-app-credential.model';
import { MediaUploadOptions, UploadMediaResponse } from '../interfaces/whatsapproute.interface';
import FormData, { AppendOptions } from 'form-data';


interface IRouteResponse {
  success?: boolean;
  messageId?: string;
  [key: string]: any;
}

interface WhatsAppMessagePayload {
  to: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'template' | 'interactive';
  text?: string;
  caption?: string;
  mediaUrl?: string;
  mediaId?: string;
  filename?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  interactive?: any;
  from?: string;
  metadata?: any;
}

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'super-secret-key';

export default class WhatsAppRouteService {

  static async createRoute(data: IWhatsAppRouteAttributes) {
    const credential = await WhatsAppCredential.findByPk(data.credentialId);
    if (!credential) {
      throw new Error('Invalid credentialId — WhatsApp Credential not found');
    }

    const route = await WhatsAppRoute.create({
      ...data,
      usageCount: 0,
      status: data.status || 'active',
      isDefault: data.isDefault ?? false
    });

    return route;
  }

  static async createCredential(data: any) {
    try {
      let credentialsHash = encryptData(JSON.stringify(data.credentials), ENCRYPTION_KEY);

      const credential = await WhatsAppCredential.create({
        provider: data.provider,
        credentials: credentialsHash || null,
        encryptedConfig: data.encryptedConfig,
        requestUrlTemplate: data.requestUrlTemplate || null,
        headersTemplate: data.headersTemplate || null,
        bodyTemplate: data.bodyTemplate || null,
        contentType: data.contentType || 'application/json',
        successMatch: data.successMatch || null,
        webhookSecretHash: data.webhookSecretHash || null,
        businessId: data.businessId, 
      });

      return credential;
    } catch (err: any) {
      throw new Error(`Failed to create WhatsApp credential: ${err.message}`);
    }
  }

  static async updateCredential(id: string, data: any) {
    try {
      const updateData: any = {};

      if (data.provider !== undefined) updateData.provider = data.provider;
      if (data.businessId !== undefined) updateData.businessId = data.businessId;
      
      if (data.credentials !== undefined) {
        updateData.credentials = encryptData(
          JSON.stringify(data.credentials),
          ENCRYPTION_KEY
        );
      }

      if (data.encryptedConfig !== undefined)
        updateData.encryptedConfig = data.encryptedConfig;
      if (data.requestUrlTemplate !== undefined)
        updateData.requestUrlTemplate = data.requestUrlTemplate;
      if (data.headersTemplate !== undefined)
        updateData.headersTemplate = data.headersTemplate;
      if (data.bodyTemplate !== undefined)
        updateData.bodyTemplate = data.bodyTemplate;
      if (data.contentType !== undefined)
        updateData.contentType = data.contentType;
      if (data.successMatch !== undefined)
        updateData.successMatch = data.successMatch;
      if (data.webhookSecretHash !== undefined)
        updateData.webhookSecretHash = data.webhookSecretHash;

      const [affectedRows] = await WhatsAppCredential.update(updateData, {
        where: { id },
      });

      if (!affectedRows) return null;

      return await WhatsAppCredential.findByPk(id);
    } catch (err: any) {
      throw new Error(`Failed to update credential: ${err.message}`);
    }
  }

  static async getAllCredentials() {
    return WhatsAppCredential.findAll();
  }

  static async getCredentialById(id: number) {
    return WhatsAppCredential.findByPk(id);
  }

  /**
   * 🚀 Send WhatsApp message with smart template fallback
   */
  static async sendMessage(routeId: number, payload: WhatsAppMessagePayload) {
    try {
      const route = await WhatsAppRoute.findByPk(routeId, {
        include: [{ model: WhatsAppCredential, as: 'credential' }]
      });

      if (!route) {
        throw new Error('Route not found');
      }

      if (route.status !== 'active') {
        throw new Error('Route is not active');
      }

      console.log('🚀 Using WhatsApp Route:', route.id, route.name);

      const credential = await WhatsAppCredential.findByPk(route.credentialId);
      if (!credential) {
        throw new Error('Credential not found for this route');
      }

      const config = credential.credentials
        ? JSON.parse(decryptData(credential.credentials, ENCRYPTION_KEY))
        : {};

      console.log('✅ Config loaded successfully');

      // 🔍 Determine if we should use template (for initial contact)
      const messageType = payload.type || 'template'; // Default to template for safety
      console.log(`📨 Preparing to send ${messageType} `);
      // template
      // Build WhatsApp API request body
      const messageBody = this.buildMessageBody(payload, messageType, route, config);
      console.log('🛠️  Built message body for type:', messageBody);
      const ctx = {
        ...config,
        metaPhoneId: route.metaPhoneId,
        accessToken: config.accessToken,
        to: payload.to,
        message: payload.text || payload.caption || '',
        from: payload.from || route.senderName || config.phoneNumber,
      };

      const url = mustache.render(
        credential.requestUrlTemplate || 
        'https://graph.facebook.com/v21.0/{{metaPhoneId}}/messages',
        ctx
      );

      const headersTemplate = credential.headersTemplate || 
        '{"Authorization": "Bearer {{accessToken}}", "Content-Type": "application/json"}';
      const headers = JSON.parse(mustache.render(headersTemplate, ctx));

      const axiosConfig: any = {
        url,
        method: 'POST',
        headers,
        timeout: 15000,
        data: messageBody,
      };

      console.log('📤 Sending WhatsApp message:', {
        url,
        type: messageType,
        to: payload.to,
        template: messageType === 'template' ? payload.templateName : 'N/A'
      });

      console.log('📦 Request body:', JSON.stringify(messageBody, null, 2));

      const res = await axios(axiosConfig);
      const response: IRouteResponse = res.data || {};

      const isSuccess = this.checkSuccess(response, credential.successMatch);

      await route.update({
        usageCount: (route.usageCount || 0) + 1,
        lastUsedAt: new Date(),
      });

      const contentType = this.determineContentType(messageType, payload);

      await Message.create({
        clientId: route.clientId,
        channelId: route.id,
        direction: 'outbound',
        type: 'content',
        content: payload.text || payload.caption || `${messageType} message`,
        contentType: contentType,
        status: isSuccess ? 'processed' : 'queue',
        sentCount: isSuccess ? 1 : 0,
        failedCount: isSuccess ? 0 : 1,
        metadata: {
          response,
          messageType,
          to: payload.to,
          routeId: route.id,
          whatsappMessageId: response.messages?.[0]?.id,
        },
      });

      return {
        success: isSuccess,
        response,
        messageId: response.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error('❌ Failed to send WhatsApp message:', error.response?.data || error.message);
      
      if (routeId) {
        const route = await WhatsAppRoute.findByPk(routeId);
        if (route) {
          await Message.create({
            clientId: route.clientId,
            channelId: route.id,
            direction: 'outbound',
            type: 'content',
            content: payload.text || 'Failed message',
            contentType: 'text',
            status: 'queue',
            sentCount: 0,
            failedCount: 1,
            metadata: {
              error: error.response?.data || error.message,
              to: payload.to,
              routeId: route.id,
            },
          });
        }
      }

      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 🔨 Build message body based on type
   */
  private static buildMessageBody(
    payload: WhatsAppMessagePayload,
    messageType: string,
    route: any,
    config: any
  ): any {
    const baseBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: payload.to.replace('+', ''), // Remove + from phone number
      type: messageType,
    };

    switch (messageType) {
      case 'template':
        // 📋 Use WhatsApp approved template (required for first contact)
        return {
          ...baseBody,
          template: {
            name: payload.templateName || 'hello_world', // Default template
            language: {
              code: payload.templateLanguage || 'en_US',
            },
            ...(payload.templateComponents && {
              components: payload.templateComponents,
            }),
          },
        };

      case 'text':
        return {
          ...baseBody,
          text: {
            preview_url: true,
            body: payload.text || '',
          },
        };

   case 'image':
  return {
    ...baseBody,
    image: payload.mediaId
      ? { id: payload.mediaId, ...(payload.caption !== undefined && payload.caption !== null ? { caption: payload.caption } : {}) }
      : { link: payload.mediaUrl, ...(payload.caption !== undefined && payload.caption !== null ? { caption: payload.caption } : {}) },
  };

      case 'video':
        return {
          ...baseBody,
          video: payload.mediaId
            ? { id: payload.mediaId }
            : { link: payload.mediaUrl },
          ...(payload.caption && { caption: payload.caption }),
        };

      case 'audio':
        return {
          ...baseBody,
          audio: payload.mediaId
            ? { id: payload.mediaId }
            : { link: payload.mediaUrl },
        };

      case 'document':
        return {
          ...baseBody,
          document: payload.mediaId
            ? { id: payload.mediaId, ...(payload.caption !== undefined && payload.caption !== null ? { caption: payload.caption } : {}) }
            : { link: payload.mediaUrl },
          ...(payload.filename && { filename: payload.filename }),
          ...(payload.caption && { caption: payload.caption }),
        };

      case 'location':
        return {
          ...baseBody,
          location: {
            latitude: payload.latitude,
            longitude: payload.longitude,
            ...(payload.locationName && { name: payload.locationName }),
            ...(payload.locationAddress && { address: payload.locationAddress }),
          },
        };

      case 'interactive':
        return {
          ...baseBody,
          interactive: payload.interactive,
        };

      default:
        // Default to template for safety
        return {
          ...baseBody,
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US',
            },
          },
        };
    }
  }

  private static checkSuccess(response: any, successMatch?: string | null): boolean {
    if (successMatch) {
      return response.hasOwnProperty(successMatch);
    }

    return !!(
      response.messages &&
      Array.isArray(response.messages) &&
      response.messages.length > 0 &&
      response.messages[0].id
    );
  }

  private static determineContentType(
    messageType: string,
    payload: WhatsAppMessagePayload
  ): 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'both' {
    if (messageType === 'text') return 'text';
    if (messageType === 'image' && payload.caption) return 'both';
    if (messageType === 'video' && payload.caption) return 'both';
    if (messageType === 'document' && payload.caption) return 'both';
    
    if (['image', 'video', 'audio', 'document', 'location'].includes(messageType)) {
      return messageType as any;
    }

    return 'text';
  }

  /**
   * 📨 Send bulk messages with template support
   */
  static async sendBulkMessages(
    routeId: number,
    recipients: string[],
    payload: Omit<WhatsAppMessagePayload, 'to'>
  ) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendMessage(routeId, {
          ...payload,
          to: recipient,
        });
        results.push({ recipient, success: true, result });
        
        // Rate limiting: wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        results.push({ recipient, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 🎯 Send template message (for initiating conversations)
   */
  static async sendTemplateMessage(
    routeId: number,
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components?: any[]
  ) {
    return this.sendMessage(routeId, {
      to,
      type: 'template',
      templateName,
      templateLanguage: languageCode,
      templateComponents: components,
    });
  }

  /**
   * 🔓 Send free-form text (only within 24-hour window)
   */
  static async sendTextMessage(
    routeId: number,
    to: string,
    text: string
  ) {
    return this.sendMessage(routeId, {
      to,
      type: 'text',
      text,
    });
  }

  /**
   * 🔄 Handle webhook (incoming WhatsApp messages)
   */
  static async handleWebhook(routeId: number, payload: any) {
    return payload;
  }



static async uploadMedia(options: MediaUploadOptions): Promise<string> {
    try {
      const route = await WhatsAppRoute.findByPk(options.routeId);
      if (!route) throw new Error('WhatsApp route not found');

      const credential = await WhatsAppCredential.findByPk(route.credentialId);
      if (!credential) throw new Error('WhatsApp credential not found');

      const config = credential.credentials
        ? JSON.parse(decryptData(credential.credentials, ENCRYPTION_KEY))
        : {};

      const formData = new FormData();

      // Determine source
      if (options.file) {
        const appendOptions: AppendOptions = {
          filename: options.file.originalname,
          contentType: options.file.mimetype,
        };
        formData.append('file', options.file.buffer, appendOptions);
      } else if (options.fileBuffer) {
        const appendOptions: AppendOptions = {
          filename: options.filename || 'media',
          contentType: options.mimeType,
        };
        formData.append('file', options.fileBuffer, appendOptions);
      } else if (options.fileUrl) {
        const response = await axios.get<ArrayBuffer>(options.fileUrl, {
          responseType: 'arraybuffer',
        });
        const appendOptions: AppendOptions = {
          filename: options.filename || 'media',
          contentType: options.mimeType,
        };
        formData.append('file', Buffer.from(response.data as ArrayBuffer), appendOptions);
      } else {
        throw new Error('No media source provided');
      }

      formData.append('messaging_product', 'whatsapp');
      formData.append('type', options.mimeType);

      const url = `https://graph.facebook.com/v21.0/${route.metaPhoneId}/media`;
      console.log('📤 Uploading media to WhatsApp...', url);

      const axiosConfig: AxiosRequestConfig = {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      };

      const uploadResponse = await axios.post<UploadMediaResponse>(url, formData, axiosConfig);
      const mediaId = uploadResponse.data.id;

      console.log('✅ Media uploaded successfully. ID:', mediaId);
      return mediaId;

    } catch (error: any) {
      console.error('❌ Media upload failed:', error.response?.data || error.message);
      throw new Error(`Media upload failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

}