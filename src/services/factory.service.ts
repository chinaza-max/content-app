//import cron from 'node-cron';
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
//import { WhatsAppRouteService } from '../services/whatsapproute.service';
import { decryptData } from '../utils/crypto.util';
import { HttpGatewayService } from './httpRequestBuilder';


const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key';


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

    return await Message.findAll({
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
        { model: Subscriber, as: 'subscriber' },
      ],
    });
  }

  /**
   * 📤 Process a single message
   */
  private async processSingleMessage(message: Message): Promise<void> {
    console.log(`\n📤 Processing Message ID: ${message.id}`);

    try {
      // Update status to processing
      await message.update({ status: 'processing' });

      // Step 1: Get channel
      const channel = await this.getChannel(message.channelId!);
      if (!channel) {
        throw new Error(`Channel ${message.channelId} not found`);
      }

      console.log(`📢 Channel: ${channel.name} (${channel.routeType.join(', ')})`);

      // Step 2: Get subscribers
      const subscribers = await this.getEligibleSubscribers(channel, message);
      
      if (subscribers.length === 0) {
        throw new Error('No eligible subscribers found');
      }

      console.log(`👥 Found ${subscribers.length} eligible subscriber(s)`);

      // Step 3: Send to each subscriber based on their type
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
   * 👥 Get eligible subscribers based on channel rules
   */
/*
  private async getEligibleSubscribers(channel: any, message: Message): Promise<any[]> {

    // Otherwise, get all channel subscribers
    const subscriptions = await Subscription.findAll({
      where: { channelId: channel.id },
      include: [{ model: Subscriber, as: 'subscriber' }],
    });

    // Filter subscribers based on channel monetization and subscription status
    const eligibleSubscribers: any[] = [];

    for (const subscription of subscriptions) {
      const subscriber = subscription.get('subscriber') as any;

      // Check if subscriber is active
      if (subscriber.status !== SubscriberStatus.ACTIVE) {
        console.log(`⏭️  Skipping inactive subscriber: ${subscriber.phone}`);
        continue;
      }

      // For paid channels, check subscription status
      if (channel.monetizationType === MonetizationType.PAID) {
        if (subscription.status !== 'active') {
          console.log(`⏭️  Skipping unpaid subscriber: ${subscriber.phone}`);
          continue;
        }
      }

      // Validate route type compatibility
      if (!this.isRouteTypeCompatible(channel.routeType, subscriber.subscriptionType)) {
        console.log(`⏭️  Skipping incompatible subscriber: ${subscriber.phone} (${subscriber.subscriptionType})`);
        continue;
      }

      eligibleSubscribers.push(subscriber);
    }

    return eligibleSubscribers;
  }*/



private async getEligibleSubscribers(channel: Channel, message: Message): Promise<Subscriber[]> {
  const whereClause: any = {
    status: 'active', // active subscriber
  };

  // Optionally filter by routeType
  if (channel.routeType && channel.routeType.length > 0) {
    whereClause.subscriptionType = channel.routeType; // assumes overlap
  }

  const subscriptions = await Subscription.findAll({
    where: {
      channelId: channel.id,
      ...(channel.monetizationType === 'paid' && { status: 'active' }), // only active paid subs
    },
    include: [
      {
        model: Subscriber,
        as: 'subscriber',
        where: whereClause,
        attributes: ['phone'],
      },
    ],
    attributes: [], // only pull subscriber fields, not subscription
  })as (Subscription & { subscriber: Subscriber })[];;

  // Extract subscribers directly
  return subscriptions.map((sub) => sub.get('subscriber'));
}

  /**
   * ✅ Check if subscriber's type matches channel's route types
   */
  private isRouteTypeCompatible(channelRoutes: RouteType[], subscriberType: RouteType): boolean {
    return channelRoutes.includes(subscriberType);
  }

  /**
   * 📨 Send message to all eligible subscribers
   */
  private async sendToSubscribers(
    message: Message,
    channel: any,
    subscribers: any[]
  ): Promise<Array<{ subscriber: any; success: boolean; error?: string }>> {
    const results: Array<{ subscriber: any; success: boolean; error?: string }> = [];

         if (channel.routeType === RouteType.SMS) {
           await this.sendViaSMS(message, channel, subscribers);
        } else if (channel.WHATSAPP === RouteType.WHATSAPP) {
          await this.sendViaWhatsApp(message, channel, subscribers);
        } 
    return results;
  }

  /**
   * 📱 Send via SMS
   */
  private async sendViaSMS(message: Message, channel: any, subscriber: any): Promise<boolean> {
    if (!channel.smsRoute) {
      throw new Error('SMS route not configured for this channel');
    }

    const payload = {
      to: subscriber.phone,
      text: message.content,
      from: channel.smsRoute.senderId || 'CHANNEL',
    };

    const result = await this.sendMessage(channel.smsRoute.id, payload);
    return result.success;
  }

  /**
   * 💬 Send via WhatsApp
   */
  private async sendViaWhatsApp(message: Message, channel: any, subscriber: any): Promise<boolean> {
    if (!channel.whatsappRoute) {
      throw new Error('WhatsApp route not configured for this channel');
    }

    const payload = {
      to: subscriber.phone,
      text: message.content,
    };

   // const result = await WhatsAppRouteService.sendMessage(channel.whatsappRoute.id, payload);
    return true;
  }

  /**
   * 📊 Update message with results
   */
  private async updateMessageResults(
    message: Message,
    results: Array<{ subscriber: any; success: boolean; error?: string }>
  ): Promise<void> {
    const sentCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    const responses = results.map(r => ({
      phone: r.subscriber.phone,
      success: r.success,
      error: r.error,
      timestamp: new Date(),
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

    if (retryCount < this.config.maxRetries) {
      // Retry later
      await message.update({
        status: 'queue',
        metadata: {
          ...metadata,
          retryCount: retryCount + 1,
          lastError: error.message,
          lastRetryAt: new Date(),
        },
      });
      console.log(`🔄 Message ${message.id} queued for retry (${retryCount + 1}/${this.config.maxRetries})`);
    } else {
      // Max retries reached
      await message.update({
        status: 'processed',
        failedCount: 1,
        metadata: {
          ...metadata,
          error: error.message,
          maxRetriesReached: true,
        },
      });
      console.log(`💀 Message ${message.id} failed after ${this.config.maxRetries} retries`);
    }
  }



  /**
   * 🧪 Manual trigger for testing
   */
  async processNow(): Promise<void> {
    console.log('🧪 Manual processing triggered');
    await this.processMessages();
  }

  prepareContext(
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
   * Evaluate if response indicates success
   */
   evaluateSuccess(
    response: any,
    successMatch?: string
  ): boolean {
    if (!successMatch) return true;
    
    const responseStr = JSON.stringify(response);
    return responseStr.includes(successMatch);
  }

  /**
   * Send SMS message using route configuration
   */
 async sendMessage(
    routeId: number,
    payload: { to: string; text: string; from?: string }
  ): Promise<{ success: boolean; response: any }> {
    // 1️⃣ Fetch route
    const route = await SMSRoute.findByPk(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
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

      console.log(`📊 Message delivery status: ${success ? 'Success' : 'Failed'}`);

      return { success, response };
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      throw error;
    }
  }

}

// Export singleton instance
export const messageProcessor = new MessageProcessorCron();