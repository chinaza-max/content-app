import { Channel, Client, Message, OTP, Subscriber , SMSRoute, WhatsAppRoute} from '../models';
import { BcryptUtil } from '../utils/bcrypt.util';
import { JwtUtil } from '../utils/jwt.util';
import { EmailService } from './email.service';
import { Op } from 'sequelize';
import { PurposeEnum, AccountTypeEnum } from '../constants/client.enums';
import { ChannelAttributes, ChannelCreationAttributes } from '../models/channel.model';
import { RouteType } from '../enums/channel.enum';


export class ClientService {
  static async signup(email: string, password: string, firstName: string, lastName: string, purpose:PurposeEnum , accountType: AccountTypeEnum): Promise<void> {
    const existingClient = await Client.findOne({ where: { email } });

    if (existingClient) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await BcryptUtil.hash(password);

    await Client.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      purpose,
      accountType,
      isVerified: false,
    });

    await this.sendVerificationOTP(email);
  }





  static async sendVerificationOTP(email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const client = await Client.findOne({ where: { email , isVerified: false} });

    if (!client) {

      const client2 = await Client.findOne({ where: { email , isVerified: true} });
      if(client2){
        throw new Error('acount already verified');
      }

      throw new Error('Client not found');
    }


    const { firstName, lastName } = client;
    await OTP.destroy({ where: { email } });

    await OTP.create({
      email,
      otp,
      expiresAt,
    });
    await EmailService.sendOTP(email, firstName, lastName, otp);

  }

  static async verifyOTP(email: string, otp: string): Promise<string> {
    const otpRecord = await OTP.findOne({
      where: {
        email,
        otp,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    const client = await Client.findOne({ where: { email } });

    if (!client) {
      throw new Error('Client not found');
    }

    client.isVerified = true;
    await client.save();

    await OTP.destroy({ where: { email } });

    await EmailService.sendWelcomeEmail(email, client.firstName);

    const token = JwtUtil.generateToken({
      id: client.id,
      email: client.email,
      role: 'client',
    });

    return token;
  }

  static async login(email: string, password: string): Promise<string> {
    const client = await Client.findOne({ where: { email } });

    if (!client) {
      throw new Error('Invalid credentials');
    }

    if (!client.isVerified) {
      throw new Error('Please verify your email first');
    }

    const isPasswordValid = await BcryptUtil.compare(password, client.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = JwtUtil.generateToken({
      id: client.id,
      email: client.email,
      role: 'client',
    });

    return token;
  }

  static async getOverview(clientId: number) {
    const totalSubscribers = await Subscriber .count({
      include: [{ model: Channel, where: { clientId } }],
    });

    const messages = await Message.findAll({
      where: { clientId },
      attributes: ['status'],
    });

    const totalMessages = messages.length;
    const queue = messages.filter(m => m.status === 'queue').length;
    const processed = messages.filter(m => m.status === 'processed').length;
    const processing = messages.filter(m => m.status === 'processing').length;
   // const deliveryRate = totalMessages ? (delivered / totalMessages) * 100 : 0;

    return {
      stats: {
        totalSubscribers,
        totalMessages,
        queue,
        processed,
        processing
      },
    };
  }

  static async getMetrics(clientId: number) {
    const totalMessages = await Message.count({ where: { clientId } });
    const delivered = await Message.count({ where: { clientId, status: 'delivered' } });
    const failed = await Message.count({ where: { clientId, status: 'failed' } });
    const pending = await Message.count({ where: { clientId, status: 'pending' } });

    return {
      totalMessages,
      delivered,
      failed,
      pending,
      successRate: totalMessages ? ((delivered / totalMessages) * 100).toFixed(1) + '%' : '0%',
    };
  }

  static async getRecentActivity(clientId: number) {
    const recent = await Message.findAll({
      where: { clientId },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [Channel],
    });

    return recent.map((m, i) => ({
      id: m.id,
      title: 'Message broadcast sent',
      details: `Delivered to ${m.sentCount || 0} subscribers`,
      timeAgo: '2h ago', // can later replace with dynamic calculation
    }));
  }

  static async getQuickActions(clientId: number) {
    return [
      { title: 'Send a new broadcast', action: '/messages/create' },
      { title: 'View delivery reports', action: '/reports' },
      { title: 'Manage subscribers', action: '/subscribers' },
      { title: 'Add WhatsApp channel', action: '/channels/whatsapp' },
    ];
  }

  static async createChannel(data: ChannelCreationAttributes): Promise<Channel> {
    // ✅ Validate route type
    if (data.routeType === RouteType.SMS && data.smsRouteId) {
      const route = await SMSRoute.findOne({ where: { id: data.smsRouteId } });
      if (!route) {
        throw new Error("SMS Route not found.");
      }
      if (route.forType !== "content") {
        throw new Error("Selected SMS route is not a content route.");
      }
    }

    if (data.routeType === RouteType.WHATSAPP && data.whatsappRouteId) {
      const route = await WhatsAppRoute.findOne({ where: { id: data.whatsappRouteId } });
      if (!route) {
        throw new Error("WhatsApp Route not found.");
      }
      if (route.forType !== "content") {
        throw new Error("Selected WhatsApp route is not a content route.");
      }
    }
/*
    if (data.routeType === RouteType.EMAIL && (data as any).emailRouteId) {
      const route = await EmailRoute.findOne({ where: { id: (data as any).emailRouteId } });
      if (!route) {
        throw new Error("Email Route not found.");
      }
      if (route.type !== "content") {
        throw new Error("Selected Email route is not a content route.");
      }
    }
*/
    // ✅ Create Channel
    const channel = await Channel.create(data);
    return channel;
  }

  // Get all channels (with optional filters)
  static async getAllChannels(filters: Partial<ChannelAttributes > = {}): Promise<Channel[]> {
    const channels = await Channel.findAll({ where: filters });
    return channels;
  }

  // Get channel by ID
  static async getChannelById(id: number): Promise<Channel | null> {
    return Channel.findByPk(id);
  }

  // Update channel
  static async updateChannel(id: number, data: Partial<ChannelAttributes>): Promise<Channel | null> {
    const channel = await Channel.findByPk(id);
    if (!channel) return null;

    await channel.update(data);
    return channel;
  }

  // Delete channel
  static async deleteChannel(id: number): Promise<boolean> {
    const deleted = await Channel.destroy({ where: { id } });
    return !!deleted;
  }


  static async createMessage(data:any,clientId:number) {
    // ensure channel exists
    const channel = await Channel.findByPk(data.channelId);
    if (!channel) throw new Error("Channel not found");

    // store as pending
    const message = await Message.create({
      ...data,
      clientId
    });

    return message;
  }

  // fetch messages to process by cron
  static async getPendingMessages(limit = 50) {
    return Message.findAll({ where: { status: "pending" }, limit });
  }
}