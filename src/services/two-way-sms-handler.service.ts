// =============================
// COMPLETE 2-WAY SMS WEBHOOK SYSTEM
// All classes in one file for easy use
// =============================

import crypto from 'crypto';
import { Request, Response } from 'express';
import SMSRoute from '../models/smsroute.model';
import { decryptData } from '../utils/crypto.util';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key';

// =============================
// 1️⃣ JSON Path Extractor
// =============================
export class JsonPathExtractor {
  /**
   * Extract value from nested JSON using dot notation
   * Example: "data.message.status" -> obj.data.message.status
   */
  static extract(obj: any, path: string): any {
    if (!path) return obj;

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      // Handle array notation: items[0]
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        result = result?.[arrayKey]?.[parseInt(index, 10)];
      } else {
        result = result?.[key];
      }

      if (result === undefined) return undefined;
    }

    return result;
  }

  /**
   * Check if extracted value matches expected value
   */
  static matches(obj: any, path: string, expectedValue: any): boolean {
    const value = this.extract(obj, path);
    return value === expectedValue;
  }
}

// =============================
// 2️⃣ Webhook Signature Validator
// =============================
export class WebhookSignatureValidator {
  /**
   * Validate HMAC signature (SHA256, SHA1, MD5)
   */
  static validate(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' | 'md5' = 'sha256',
    prefix: string = ''
  ): boolean {
    try {
      // Remove prefix if exists (e.g., "sha256=")
      const cleanSignature = signature.startsWith(prefix)
        ? signature.slice(prefix.length)
        : signature;

      // Compute expected signature
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(payload)
        .digest('hex');

      // Timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('❌ Signature validation error:', error);
      return false;
    }
  }

  /**
   * Validate basic auth
   */
  static validateBasicAuth(
    authHeader: string,
    expectedUsername: string,
    expectedPassword: string
  ): boolean {
    try {
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return false;
      }

      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const [username, password] = credentials.split(':');

      return username === expectedUsername && password === expectedPassword;
    } catch (error) {
      console.error('❌ Basic auth validation error:', error);
      return false;
    }
  }

  /**
   * Validate bearer token
   */
  static validateBearerToken(authHeader: string, expectedToken: string): boolean {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }

      const token = authHeader.slice(7);
      return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(expectedToken)
      );
    } catch (error) {
      console.error('❌ Bearer token validation error:', error);
      return false;
    }
  }
}

// =============================
// 3️⃣ Type Definitions
// =============================

export interface RouteInstallationPayload {
  // Basic Info
  provider: string;
  name: string;
  senderId?: string;
  forType: 'content' | 'bulksms';
  isDefault: boolean;

  // Sending Configuration (Outgoing SMS)
  credentials: Record<string, any>;
  requestUrlTemplate: string;
  requestMethod: 'POST' | 'GET' | 'PUT' | 'DELETE';
  headersTemplate?: string;
  bodyTemplate?: string;
  contentType?: string;
  successMatch?: string;

  // Webhook Configuration (Incoming SMS & Delivery Reports)
  webhook?: {
    enabled: boolean;
    customPath?: string;
    
    // Security
    signatureValidation?: {
      enabled: boolean;
      headerName: string;
      algorithm: 'sha256' | 'sha1' | 'md5' | 'bearer' | 'basic' | 'none';
      prefix?: string;
      secretKey?: string;
      username?: string;
      password?: string;
    };

    // Payload Parsing - Incoming SMS
    incomingMessage?: {
      enabled: boolean;
      fromPath: string;
      messagePath: string;
      timestampPath?: string;
      messageIdPath?: string;
    };

    // Payload Parsing - Delivery Reports
    deliveryReport?: {
      enabled: boolean;
      messageIdPath: string;
      statusPath: string;
      statusMapping: Record<string, 'delivered' | 'failed' | 'pending'>;
      errorPath?: string;
      externalIdPath?: string;
      timestampPath?: string;
    };

    // Response Template
    responseTemplate?: string;
    responseStatus?: number;
  };
}

export interface IncomingSMS {
  routeId: number;
  provider: string;
  from: string;
  to: string;
  text: string;
  messageId?: string;
  timestamp: Date;
  rawPayload: any;
}

export interface DeliveryReport {
  routeId: number;
  provider: string;
  messageId: string;
  externalId?: string;
  status: 'delivered' | 'failed' | 'pending';
  error?: string;
  timestamp: Date;
  rawPayload: any;
}

// =============================
// 4️⃣ Main Webhook Handler
// =============================

export class TwoWaySMSHandler {
  /**
   * Main webhook handler - determines if it's incoming SMS or delivery report
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    const webhookPath = req.path;
    console.log(`📥 Webhook received: ${req.method} ${webhookPath}`);
    console.log(`📦 Payload:`, req.body);

    try {
      // 1️⃣ Find route by webhook path
      const route = await SMSRoute.findOne({
        where: { webhookPath, status: 'active' }
      });

      if (!route) {
        console.warn(`⚠️ No route found for: ${webhookPath}`);
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      console.log(`✅ Route found: ${route.name} (${route.provider})`);

      // 2️⃣ Decrypt webhook config
      const webhookConfig = route.encryptedConfig
        ? JSON.parse(decryptData(route.encryptedConfig, ENCRYPTION_KEY))
        : {};

      // 3️⃣ Validate signature if enabled
      if (webhookConfig.signatureValidation?.enabled) {
        const isValid = this.validateSignature(req, webhookConfig.signatureValidation);
        if (!isValid) {
          console.error('❌ Signature validation failed');
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
        console.log('✅ Signature validated');
      }

      // 4️⃣ Determine webhook type and parse
      const payload = req.body;
      const isIncomingSMS = this.isIncomingSMS(payload, webhookConfig);

      if (isIncomingSMS && webhookConfig.incomingMessage?.enabled) {
        // Handle incoming SMS
        console.log('📨 Detected: Incoming SMS');
        const incomingSMS = this.parseIncomingSMS(payload, route, webhookConfig);
        await this.processIncomingSMS(incomingSMS);
        console.log('✅ Incoming SMS processed');
      } else if (webhookConfig.deliveryReport?.enabled) {
        // Handle delivery report
        console.log('📊 Detected: Delivery Report');
        const deliveryReport = this.parseDeliveryReport(payload, route, webhookConfig);
        await this.processDeliveryReport(deliveryReport);
        console.log('✅ Delivery report processed');
      } else {
        console.warn('⚠️ Could not determine webhook type');
      }

      // 5️⃣ Send response
      this.sendWebhookResponse(res, webhookConfig);

    } catch (error: any) {
      console.error('💥 Webhook error:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Validate webhook signature
   */
  private static validateSignature(
    req: Request,
    signatureConfig: any
  ): boolean {
    const signature = req.headers[signatureConfig.headerName.toLowerCase()] as string;

    if (!signature) {
      console.warn(`⚠️ Missing signature header: ${signatureConfig.headerName}`);
      return false;
    }

    const algorithm = signatureConfig.algorithm;

    if (algorithm === 'bearer') {
      return WebhookSignatureValidator.validateBearerToken(
        signature,
        signatureConfig.secretKey
      );
    }

    if (algorithm === 'basic') {
      return WebhookSignatureValidator.validateBasicAuth(
        signature,
        signatureConfig.username,
        signatureConfig.password
      );
    }

    if (algorithm === 'none') {
      return true;
    }

    // HMAC validation
    const rawBody = JSON.stringify(req.body);
    return WebhookSignatureValidator.validate(
      rawBody,
      signature,
      signatureConfig.secretKey,
      algorithm,
      signatureConfig.prefix || ''
    );
  }

  /**
   * Determine if webhook is incoming SMS or delivery report
   */
  private static isIncomingSMS(payload: any, config: any): boolean {
    if (!config.incomingMessage?.enabled) return false;

    // Check if incoming message fields exist
    const hasFrom = config.incomingMessage?.fromPath &&
      JsonPathExtractor.extract(payload, config.incomingMessage.fromPath);
    
    const hasMessage = config.incomingMessage?.messagePath &&
      JsonPathExtractor.extract(payload, config.incomingMessage.messagePath);

    return !!(hasFrom && hasMessage);
  }

  /**
   * Parse incoming SMS from webhook payload
   */
  private static parseIncomingSMS(
    payload: any,
    route: SMSRoute,
    config: any
  ): IncomingSMS {
    const incomingConfig = config.incomingMessage;

    const from = JsonPathExtractor.extract(payload, incomingConfig.fromPath);
    const text = JsonPathExtractor.extract(payload, incomingConfig.messagePath);

    console.log(`📱 Parsing incoming SMS: From=${from}, Text="${text}"`);

    return {
      routeId: route.id,
      provider: route.provider,
      from,
      to: route.senderId || '',
      text,
      messageId: incomingConfig.messageIdPath
        ? JsonPathExtractor.extract(payload, incomingConfig.messageIdPath)
        : undefined,
      timestamp: incomingConfig.timestampPath
        ? new Date(JsonPathExtractor.extract(payload, incomingConfig.timestampPath))
        : new Date(),
      rawPayload: payload
    };
  }

  /**
   * Parse delivery report from webhook payload
   */
  private static parseDeliveryReport(
    payload: any,
    route: SMSRoute,
    config: any
  ): DeliveryReport {
    const deliveryConfig = config.deliveryReport;

    // Extract status and map it
    const providerStatus = JsonPathExtractor.extract(payload, deliveryConfig.statusPath);
    const mappedStatus = deliveryConfig.statusMapping[providerStatus] || 'pending';

    console.log(`📊 Parsing delivery report: Status="${providerStatus}" → "${mappedStatus}"`);

    return {
      routeId: route.id,
      provider: route.provider,
      messageId: JsonPathExtractor.extract(payload, deliveryConfig.messageIdPath),
      externalId: deliveryConfig.externalIdPath
        ? JsonPathExtractor.extract(payload, deliveryConfig.externalIdPath)
        : undefined,
      status: mappedStatus,
      error: deliveryConfig.errorPath
        ? JsonPathExtractor.extract(payload, deliveryConfig.errorPath)
        : undefined,
      timestamp: deliveryConfig.timestampPath
        ? new Date(JsonPathExtractor.extract(payload, deliveryConfig.timestampPath))
        : new Date(),
      rawPayload: payload
    };
  }

  /**
   * Process incoming SMS (save to DB, trigger webhooks, auto-reply, etc.)
   */
  private static async processIncomingSMS(sms: IncomingSMS): Promise<void> {
    console.log('📨 Processing incoming SMS:', {
      from: sms.from,
      to: sms.to,
      text: sms.text,
      messageId: sms.messageId
    });

    // TODO: Implement your business logic
    // Examples:
    
    // 1. Save to database
    // await IncomingSMSLog.create({
    //   routeId: sms.routeId,
    //   provider: sms.provider,
    //   from: sms.from,
    //   to: sms.to,
    //   message: sms.text,
    //   externalMessageId: sms.messageId,
    //   receivedAt: sms.timestamp,
    //   rawPayload: sms.rawPayload
    // });
    
    // 2. Trigger client webhook
    // await ClientWebhookService.notifyIncomingSMS(sms);
    
    // 3. Auto-reply logic
    // if (sms.text.toLowerCase().includes('help')) {
    //   await SMSRouteService.sendMessage(sms.routeId, {
    //     to: sms.from,
    //     text: 'Help: Reply STOP to unsubscribe, INFO for information'
    //   });
    // }
    
    // 4. Keyword-based routing
    // const keyword = sms.text.split(' ')[0].toLowerCase();
    // switch(keyword) {
    //   case 'subscribe':
    //     await SubscriptionService.subscribe(sms.from);
    //     break;
    //   case 'stop':
    //     await SubscriptionService.unsubscribe(sms.from);
    //     break;
    // }
  }

  /**
   * Process delivery report (update message status)
   */
  private static async processDeliveryReport(report: DeliveryReport): Promise<void> {
    console.log('📊 Processing delivery report:', {
      messageId: report.messageId,
      status: report.status,
      error: report.error,
      externalId: report.externalId
    });

    // TODO: Update message status in database
    // await MessageLog.update(
    //   {
    //     status: report.status,
    //     externalMessageId: report.externalId,
    //     errorMessage: report.error,
    //     deliveredAt: report.status === 'delivered' ? report.timestamp : null,
    //     failedAt: report.status === 'failed' ? report.timestamp : null
    //   },
    //   { where: { id: report.messageId } }
    // );
    
    // TODO: Trigger client webhook for delivery status
    // await ClientWebhookService.notifyDeliveryStatus(report);
  }

  /**
   * Send webhook response back to provider
   */
  private static sendWebhookResponse(res: Response, config: any): void {
    const status = config.responseStatus || 200;
    
    if (config.responseTemplate) {
      const template = config.responseTemplate;
      
      if (template.trim().startsWith('<?xml')) {
        // XML response (e.g., Twilio TwiML)
        res.status(status).header('Content-Type', 'text/xml').send(template);
      } else {
        // JSON response
        try {
          const json = JSON.parse(template);
          res.status(status).json(json);
        } catch {
          res.status(status).send(template);
        }
      }
    } else {
      // Default response
      res.status(status).json({ success: true, message: 'Webhook processed' });
    }
  }
}

// =============================
// 5️⃣ Express Route Setup
// =============================
import express, { Router } from 'express';

export function setupWebhookRoutes(): Router {
  const router = express.Router();

  // Universal webhook endpoint
  router.post('/webhooks/*', async (req, res) => {
    await TwoWaySMSHandler.handleWebhook(req, res);
  });

  router.get('/webhooks/*', async (req, res) => {
    await TwoWaySMSHandler.handleWebhook(req, res);
  });

  return router;
}
