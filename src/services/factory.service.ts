import * as cron from 'node-cron';
import { Op } from 'sequelize';
import Message from '../models/message.model';
import Channel from '../models/channel.model';
import Subscriber from '../models/subscriber.model';
import Subscription from '../models/subscription.model';
import SMSRoute from '../models/smsroute.model';
import WhatsAppRoute from '../models/whatsapproute.model';
import { RouteType, MonetizationType, ChannelStatus } from '../enums/channel.enum';
import { SubscriberStatus } from '../enums/subscriber.enum';
import { decryptData } from '../utils/crypto.util';
import { HttpGatewayService } from './httpRequestBuilder';
import WhatsAppRouteService from './whatsapproute.service';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key';

interface ProcessingResult {
  subscriber: Subscriber;
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * 🚀 MessageProcessorCron
 * 
 * A powerful cron job class that processes queued messages.
 * 
 * Features:
 * - Processes scheduled and immediate messages
 * - Validates channel and subscriber compatibility
 * - Handles SMS and WhatsApp routing
 * - Respects subscription status for paid channels
 * - Batch processing with configurable limits
 * - Comprehensive error handling and logging
 */
export class MessageProcessorCron {
  private cronJob: cron.ScheduledTask | null = null;
  private isProcessing: boolean = false;
  
  // Configuration
  private config = {
    cronSchedule: '*/2 * * * *', // Run every 2 minutes
    batchSize: 50, // Process 50 messages per run
    maxRetries: 3, // Maximum retry attempts
    retryDelay: 5000, // 5 seconds between retries
  };

  constructor(customConfig?: Partial<typeof MessageProcessorCron.prototype.config>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  /**
   * 🟢 Start the cron job
   */
  start(): void {
    if (this.cronJob) {
      console.log('⚠️  MessageProcessor is already running');
      return;
    }

    console.log('🚀 Starting MessageProcessor Cron Job');
    console.log(`⏰ Schedule: ${this.config.cronSchedule}`);
    console.log(`📦 Batch Size: ${this.config.batchSize}`);

    this.cronJob = cron.schedule(this.config.cronSchedule, async () => {
      await this.processMessages();
    });

    console.log('✅ MessageProcessor started successfully');
  }

  /**
   * 🔴 Stop the cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 MessageProcessor stopped');
    }
  }

  /**
   * 🔄 Main processing loop
   */
  private async processMessages(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏭️  Skipping - previous batch still processing');
      return;
    }

    this.isProcessing = true;
    console.log('\n🔄 ===== Processing Message Batch =====');

    try {
      // Fetch queued messages (scheduled or immediate)
      const messages = await this.fetchQueuedMessages();
      
      if (messages.length === 0) {
        console.log('📭 No messages to process');
        return;
      }

      console.log(`📨 Found ${messages.length} message(s) to process`);

      // Process each message
      for (const message of messages) {
        await this.processSingleMessage(message);
      }

      console.log('✅ Batch processing completed');
    } catch (error: any) {
      console.error('❌ Error in message processing:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 📥 Fetch messages ready for processing
   */
  private async fetchQueuedMessages(): Promise<Message[]> {
    const now = new Date();

    const messages = await Message.findAll({
      where: {
        status: 'queue',
        [Op.or]: [
          { scheduledAt: null }, // Immediate messages
          { scheduledAt: { [Op.lte]: now } }, // Scheduled messages whose time has come
        ],
      },
      limit: this.config.batchSize,
      order: [['createdAt', 'ASC']],
      include: [
        { model: Channel, as: 'channel' },
      ],
    });

    console.log(`📊 Fetched ${messages.length} queued messages`);
    return messages;
  }

  /**
   * 📤 Process a single message
   */
  private async processSingleMessage(message: Message): Promise<void> {
    //console.log(`\n📤 Processing Message ID: ${message.id}`);
    //console.log(`🛠️ message :`, message);

    try {
      // Update status to processing
      await message.update({ status: 'processing' });

      // Step 1: Get channel with routes
      const channel = await this.getChannel(message.channelId!);
      if (!channel) {
        throw new Error(`Channel ${message.channelId} not found`);
      }

      if (channel.status !== ChannelStatus.ACTIVE) {
        throw new Error(`Channel ${channel.name} is not active`);
      }

      console.log(`📢 Channel: ${channel.name} (${channel.routeType})`);

      // Step 2: Get subscribers
      const subscribers = await this.getEligibleSubscribers(channel, message);
      
      if (subscribers.length === 0) {
        throw new Error('No eligible subscribers found');
      }

      console.log(`👥 Found ${subscribers.length} eligible subscriber(s)`);

      // Step 3: Send to each subscriber based on channel route type
      const results = await this.sendToSubscribers(message, channel, subscribers);

      // Step 4: Update message with results
      await this.updateMessageResults(message, results);

      console.log(`✅ Message ${message.id} processed successfully`);
    } catch (error: any) {
      console.error(`❌ Error processing message ${message.id}:`, error.message);
      await this.handleProcessingError(message, error);
    }
  }

  /**
   * 📢 Get channel with routes
   */
  private async getChannel(channelId: number): Promise<any> {
    return await Channel.findByPk(channelId, {
      include: [
        { model: SMSRoute, as: 'smsRoute' },
        { model: WhatsAppRoute, as: 'whatsappRoute' },
      ],
    });
  }

  /**
   * 👥 Get eligible subscribers for the channel
   */
  private async getEligibleSubscribers(
    channel: Channel, 
    message: Message
  ): Promise<Subscriber[]> {
    const whereClause: any = {
      status: SubscriberStatus.ACTIVE,
    };

    // Filter by subscription type if channel has specific route type
    if (channel.routeType) {
      whereClause.subscriptionType = channel.routeType;
    }

    const subscriptions = await Subscription.findAll({
      where: {
        channelId: channel.id,
        // For paid channels, only include active subscriptions
        ...(channel.monetizationType === MonetizationType.PAID && { 
          status: 'active' 
        }),
      },
      include: [
        {
          model: Subscriber,
          as: 'subscriber',
          where: whereClause,
          attributes: ['id', 'phone', 'subscriptionType', 'status'],
        },
      ],
    }) as (Subscription & { subscriber: Subscriber })[];

    // Extract unique subscribers
    const subscriberMap = new Map<number, Subscriber>();
    subscriptions.forEach((sub) => {
      const subscriber = sub.subscriber;
      if (subscriber && !subscriberMap.has(subscriber.id)) {
        subscriberMap.set(subscriber.id, subscriber);
      }
    });

    return Array.from(subscriberMap.values());
  }

  /**
   * 📨 Send message to all eligible subscribers
   */
  private async sendToSubscribers(
    message: Message,
    channel: any,
    subscribers: Subscriber[]
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (const subscriber of subscribers) {
      try {
        let success = false;
        let messageId: string | undefined;

        if (channel.routeType === RouteType.SMS) {
          const result = await this.sendViaSMS(message, channel, subscriber);
          success = result.success;
          messageId = result.messageId;
        } else if (channel.routeType === RouteType.WHATSAPP) {
          const result = await this.sendViaWhatsApp(message, channel, subscriber);
          success = result.success;
          messageId = result.messageId;
        } else {
          throw new Error(`Unsupported route type: ${channel.routeType}`);
        }

        results.push({
          subscriber,
          success,
          messageId,
        });

        console.log(`✅ Sent to ${subscriber.phone} via ${channel.routeType}`);
      } catch (error: any) {
        console.error(`❌ Failed to send to ${subscriber.phone}:`, error.message);
        results.push({
          subscriber,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 📱 Send via SMS
   */
  private async sendViaSMS(
    message: Message, 
    channel: any, 
    subscriber: Subscriber
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!channel.smsRoute) {
      throw new Error('SMS route not configured for this channel');
    }

    const payload = {
      to: subscriber.phone,
      text: message.content,
      from: channel.smsRoute.senderId || 'CHANNEL',
    };

    const result = await this.sendSMSMessage(channel.smsRoute.id, payload);
    return {
      success: result.success,
      messageId: result.response?.messageId,
    };
  }

  /**
   * 💬 Send via WhatsApp
   */
  private async sendViaWhatsApp(
    message: Message, 
    channel: any, 
    subscriber: Subscriber
  ): Promise<{ success: boolean; messageId?: string }> {
    console.log('💬 Sending WhatsApp message...');

    if (!channel.whatsappRoute) {
      throw new Error('WhatsApp route not configured for this channel');
    }

    // Build WhatsApp payload based on content type
    const payload = this.buildWhatsAppPayload(message, subscriber);

    console.log('📨 Preparing to send', message.contentType, );
    console.log('🛠️  Built WhatsApp payload:', JSON.stringify(payload, null, 2));

    const result = await WhatsAppRouteService.sendMessage(
      channel.whatsappRoute.id, 
      payload
    );

    return {
      success: result.success,
      messageId: result.messageId,
    };
  }

  /**
   * 🔨 Build WhatsApp payload based on message content type
   */
  private buildWhatsAppPayload(message: Message, subscriber: Subscriber): any {
    const basePayload = {
      to: subscriber.phone.replace('+', ''), // Remove + for WhatsApp API
    };

    console.log(`🔧 Building payload for contentType: ${message.contentType}`);

    switch (message.contentType) {
      case 'template':
        // Template message
        return {
          ...basePayload,
          type: 'template',
          templateName: message.templateName || 'hello_world',
          templateLanguage: message.templateLanguage || 'en_US',
          templateComponents: message.templateComponents,
        };

      case 'text':
        // Plain text message
        return {
          ...basePayload,
          type: 'text',
          text: message.content,
        };

      case 'image':
        // Image message
        if (!message.mediaUrl && !message.mediaId) {
          throw new Error('Image message requires mediaUrl or mediaId');
        }
       return {
      ...basePayload,
      type: 'image',
      ...(message.mediaUrl ? { mediaUrl: message.mediaUrl } : {}),
      ...(message.mediaId ? { mediaId: message.mediaId } : {}),
      ...(message.caption !== undefined && message.caption !== null ? { caption: message.caption } : {}),
    };

      case 'video':
        // Video message
        if (!message.mediaUrl && !message.mediaId) {
          throw new Error('Video message requires mediaUrl or mediaId');
        }
        return {
          ...basePayload,
          type: 'video',
          ...(message.mediaUrl && { mediaUrl: message.mediaUrl }),
          ...(message.mediaId && { mediaId: message.mediaId }),
          ...(message.caption && { caption: message.caption }),
        };

      case 'audio':
        // Audio message
        if (!message.mediaUrl && !message.mediaId) {
          throw new Error('Audio message requires mediaUrl or mediaId');
        }
        return {
          ...basePayload,
          type: 'audio',
          ...(message.mediaUrl && { mediaUrl: message.mediaUrl }),
          ...(message.mediaId && { mediaId: message.mediaId }),
        };

      case 'document':
        // Document message
        if (!message.mediaUrl && !message.mediaId) {
          throw new Error('Document message requires mediaUrl or mediaId');
        }
        return {
          ...basePayload,
          type: 'document',
          ...(message.mediaUrl && { mediaUrl: message.mediaUrl }),
          ...(message.mediaId && { mediaId: message.mediaId }),
          ...(message.filename && { filename: message.filename }),
          ...(message.caption && { caption: message.caption }),
        };

      case 'location':
        // Location message
        if (!message.latitude || !message.longitude) {
          throw new Error('Location message requires latitude and longitude');
        }
        return {
          ...basePayload,
          type: 'location',
          latitude: message.latitude,
          longitude: message.longitude,
          ...(message.locationName && { locationName: message.locationName }),
          ...(message.locationAddress && { locationAddress: message.locationAddress }),
        };

      case 'interactive':
        // Interactive message (buttons, lists)
        try {
          return {
            ...basePayload,
            type: 'interactive',
            interactive: JSON.parse(message.content),
          };
        } catch {
          throw new Error('Invalid interactive message format - content must be valid JSON');
        }

      case 'both':
        // Text + Media (image with caption)
        if (!message.mediaUrl && !message.mediaId) {
          throw new Error('Media message requires mediaUrl or mediaId');
        }
        return {
          ...basePayload,
          type: 'image', // Default to image for 'both' type
          ...(message.mediaUrl && { mediaUrl: message.mediaUrl }),
          ...(message.mediaId && { mediaId: message.mediaId }),
          caption: message.content, // Use content as caption
        };

      default:
        // Fallback to text
        console.warn(`⚠️ Unknown contentType: ${message.contentType}, defaulting to text`);
        return {
          ...basePayload,
          type: 'text',
          text: message.content,
        };
    }
  }

  /**
   * 📊 Update message with results
   */
  private async updateMessageResults(
    message: Message,
    results: ProcessingResult[]
  ): Promise<void> {
    const sentCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    const responses = results.map(r => ({
      phone: r.subscriber.phone,
      success: r.success,
      error: r.error,
      messageId: r.messageId,
      timestamp: new Date().toISOString(),
    }));

    await message.update({
      status: 'processed',
      sentCount,
      failedCount,
      responses,
    });
  }

  /**
   * ⚠️ Handle processing errors
   */
  private async handleProcessingError(message: Message, error: Error): Promise<void> {
    const metadata = (message.metadata as any) || {};
    const retryCount = metadata.retryCount || 0;

    // Sanitize error message
    const safeErrorMessage = (error.message || "Unknown error").toString().slice(0, 255);

    if (retryCount < this.config.maxRetries) {
      // Retry later - store only minimal metadata
      await message.update({
        status: 'queue',
        metadata: {
          retryCount: retryCount + 1,
          lastError: safeErrorMessage,
          lastRetryAt: new Date().toISOString(),
        },
      });

      console.log(
        `🔄 Message ${message.id} queued for retry (${retryCount + 1}/${this.config.maxRetries})`
      );
    } else {
      // Max retries reached - keep metadata small
      await message.update({
        status: 'failed',
        failedCount: 1,
        metadata: {
          retryCount,
          error: safeErrorMessage,
          maxRetriesReached: true,
        },
      });

      console.log(
        `💀 Message ${message.id} failed after ${this.config.maxRetries} retries`
      );
    }
  }

  /**
   * 🧪 Manual trigger for testing
   */
  async processNow(): Promise<void> {
    console.log('🧪 Manual processing triggered');
    await this.processMessages();
  }

  /**
   * 🔧 Prepare context for templating
   */
  private prepareContext(
    config: Record<string, any>,
    payload: { to: string; text: string; from?: string }
  ): Record<string, any> {
    return {
      ...config,
      to: payload.to,
      text: payload.text,
      from: payload.from,
      // Add basic auth if credentials exist
      basicAuthBase64: config.accountSid && config.authToken
        ? Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')
        : undefined,
    };
  }

  /**
   * ✅ Evaluate if response indicates success
   */
  private evaluateSuccess(
    response: any,
    successMatch?: string | null
  ): boolean {
    if (!successMatch) return true;
    
    const responseStr = JSON.stringify(response);
    return responseStr.includes(successMatch);
  }

  /**
   * 📤 Send SMS message using route configuration
   */
  private async sendSMSMessage(
    routeId: number,
    payload: { to: string; text: string; from?: string }
  ): Promise<{ success: boolean; response: any }> {
    // 1️⃣ Fetch route
    const route = await SMSRoute.findByPk(routeId);
    if (!route) {
      throw new Error(`SMS Route not found: ${routeId}`);
    }

    // 2️⃣ Decrypt configuration
    const config = route.encryptedConfig
      ? JSON.parse(decryptData(route.encryptedConfig, ENCRYPTION_KEY))
      : {};

    // 3️⃣ Prepare context
    const context = this.prepareContext(config, payload);

    // 4️⃣ Send request via gateway
    try {
      const response = await HttpGatewayService.sendRequest({
        urlTemplate: route.requestUrlTemplate,
        method: route.requestMethod,
        headersTemplate: route.headersTemplate,
        bodyTemplate: route.bodyTemplate,
        contentType: route.contentType,
        context,
      });

      // 5️⃣ Evaluate success
      const success = this.evaluateSuccess(response, route.successMatch);

      console.log(`📊 SMS delivery status: ${success ? 'Success' : 'Failed'}`);

      return { success, response };
    } catch (error: any) {
      console.error('❌ Failed to send SMS:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const messageProcessor = new MessageProcessorCron();