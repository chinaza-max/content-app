import {  Response } from 'express';
import { ClientService } from '../services/client.service';
import { ResponseUtil } from '../utils/response.util';
import { clientSignupSchema, clientLoginSchema, verifyOtpSchema, createMessageSchema } from '../validators/client.validator';
import { AuthRequest } from '../types';
import { createChannelSchema , createInteractiveSchema} from '../validators/channel.validation';
import WhatsAppRouteService from '../services/whatsapproute.service';
import { Channel, Message, WhatsAppRoute } from '../models';


export class ClientController {
  static renderSignup(req: AuthRequest, res: Response): void {
    res.render('signup', { error: null });
  }

  static renderLogin(req: AuthRequest, res: Response): void {
    res.render('login', { error: null });
  }

  static async signup(req: AuthRequest, res: Response): Promise<Response> {
    try {

      const { error, value } = clientSignupSchema.validate(req.body);

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const { email, password, firstName, lastName, purpose, accountType} = value;
      await ClientService.signup(email, password, firstName, lastName , purpose, accountType);

      return ResponseUtil.success(res, 'Signup successful. Please check your email for OTP.', null, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static async verifyOTP(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { error, value } = verifyOtpSchema.validate(req.body);

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const { email, otp } = value;
      const token = await ClientService.verifyOTP(email, otp);

      res.cookie('client_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseUtil.success(res, 'Email verified successfully', { token });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static async login(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { error, value } = clientLoginSchema.validate(req.body);

      if (error) {
        return ResponseUtil.error(res, error.details[0].message, 400);
      }

      const { email, password } = value;
      const token = await ClientService.login(email, password);

      res.cookie('client_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseUtil.success(res, 'Login successful', { token });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 401);
    }
  }

  static async resendOTP(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return ResponseUtil.error(res, 'Email is required', 400);
      }


      await ClientService.sendVerificationOTP(email);
      return ResponseUtil.success(res, 'OTP sent successfully');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  static logout(req: AuthRequest, res: Response): Response {
    res.clearCookie('client_token');
    return ResponseUtil.success(res, 'Logout successful');
  }


   static async getDashboardOverview(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return ResponseUtil.error(res, 'Client ID not found', 401);
      }
      const data = await ClientService.getOverview(clientId);
      return ResponseUtil.success(res, 'Dashboard overview fetched successfully', data);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  static async getDashboardMetrics(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const clientId = req.user?.id;

      if (!clientId) {
        return ResponseUtil.error(res, 'Client ID not found', 401);
      }

      const metrics = await ClientService.getMetrics(clientId);
      return ResponseUtil.success(res, 'Dashboard metrics fetched successfully', metrics);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  static async getRecentActivity(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const clientId = req.user?.id;

      if (!clientId) {
        return ResponseUtil.error(res, 'Client ID not found', 401);
      }
      const activities = await ClientService.getRecentActivity(clientId);
      return ResponseUtil.success(res, 'Recent activity fetched successfully', activities);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  static async getQuickActions(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const clientId = req.user?.id;

      if (!clientId) {
        return ResponseUtil.error(res, 'Client ID not found', 401);
      }
      const actions = await ClientService.getQuickActions(clientId);
      return ResponseUtil.success(res, 'Quick actions loaded successfully', actions);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }


  static async createMessage(req: AuthRequest, res: Response) {
    try {
      const { error, value } = createMessageSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
      if(!req.user?.id){
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const message = await ClientService.createMessage(value, req.user?.id);

      return res.status(201).json({
        success: true,
        message: "Message lodged successfully",
        data: message,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Internal server error",
      });
    }
  }


   static async createMessageWithMedia(req: AuthRequest, res: Response) {
    try {
      // 1. Check authentication
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // 2. Check file upload
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const { channelId, caption, contentType } = req.body;

      if (!channelId) {
        return res.status(400).json({ success: false, message: "channelId is required" });
      }

      // 3. Verify channel belongs to user
      const channel = await WhatsAppRoute.findOne({
        where: { id: channelId, clientId: req.user.id },
      });

      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found or does not belong to you" });
      }

      console.log('📤 Uploading media to WhatsApp...');

      // 4. Upload media to WhatsApp and get mediaId
      const mediaId = await WhatsAppRouteService.uploadMedia({
        routeId: channel.id,
        file: req.file,
        mimeType: req.file.mimetype,
        filename: req.file.originalname,
      });

      console.log('✅ Media uploaded. ID:', mediaId);

      // 5. Determine content type
      const fileContentType = contentType || this.getContentTypeFromMimeType(req.file.mimetype);

      // 6. Create message record in DB
      const message = await ClientService.createMessageWithMedia(
        {
          channelId: parseInt(channelId),
          caption,
          fileContentType,
          mediaId,
          filename: req.file.originalname,
        },
        req.user.id
      );

      // 7. Respond
      return res.status(201).json({
        success: true,
        message: "Media uploaded and message created successfully",
        data: { message, mediaId },
      });

    } catch (err: any) {
      console.error('Upload media error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to upload media",
      });
    }
  }

  static async createInteractiveMessage(req: AuthRequest, res: Response) {
    try {
      const { error, value } = createInteractiveSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Verify channel
      const channel = await Channel.findOne({
        where: { id: value.channelId, clientId: req.user.id },
      });

      if (!channel) {
        return res.status(404).json({
          success: false,
          message: "Channel not found",
        });
      }

      // Build interactive payload based on type
      const interactivePayload = ClientController.buildInteractivePayload(value);

      // Create message
      const message = await Message.create({
        channelId: value.channelId,
        clientId: req.user.id,
        direction: 'outbound',
        type: 'content',
        content: JSON.stringify(interactivePayload),
        contentType: 'interactive',
        status: 'queue',
      });

      return res.status(201).json({
        success: true,
        message: "Interactive message created successfully",
        data: message,
      });
    } catch (err: any) {
      console.error('Create interactive message error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || "Internal server error",
      });
    }
  }



   private static buildInteractivePayload(data: any): any {
    switch (data.interactiveType) {
      case 'button':
        return {
          type: 'button',
          header: data.header,
          body: data.body,
          footer: data.footer,
          action: {
            buttons: data.buttons.map((btn: any) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        };

      case 'list':
        return {
          type: 'list',
          header: data.header,
          body: data.body,
          footer: data.footer,
          action: {
            button: data.buttonText,
            sections: data.sections
          }
        };

      case 'cta_url':
        return {
          type: 'cta_url',
          header: data.header,
          body: data.body,
          footer: data.footer,
          action: {
            name: 'cta_url',
            parameters: {
              display_text: data.ctaDisplayText,
              url: data.ctaUrl
            }
          }
        };

      default:
        throw new Error('Invalid interactive type');
    }
  }


  private static getContentTypeFromMimeType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }






   static async create(req: AuthRequest, res: Response) {
    try {
      const { error, value } = createChannelSchema.validate(req.body);


      const clientId = req?.user?.id; 

      const user={...value, clientId}
      console.log(user)
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const channel = await  ClientService.createChannel(user);
      res.status(201).json({ success: true, data: channel });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get all channels
  static async list(req: AuthRequest, res: Response) {
    try {
      const channels = await ClientService.getAllChannels();
      res.status(200).json({ success: true, data: channels });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get channel by ID
  static async get(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const channel = await ClientService.getChannelById(id);

      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found" });
      }

      res.status(200).json({ success: true, data: channel });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update channel
  static async update(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const updated = await ClientService.updateChannel(id, req.body);

      if (!updated) {
        return res.status(404).json({ success: false, message: "Channel not found" });
      }

      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Delete channel
  static async delete(req: AuthRequest , res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await ClientService.deleteChannel(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Channel not found" });
      }

      res.status(200).json({ success: true, message: "Channel deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
/*
  static  getDashboardOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req?.user?.id; 

    // 1️⃣ Count subscribers
    const totalSubscribers = await Subscriber.count({
      include: [
        {
          model: Channel,
          where: { clientId },
        },
      ],
    });

    // 2️⃣ Count messages (total, delivered, failed)
    const messages = await Message.findAll({
      where: { clientId },
      attributes: ['status'],
    });

    const totalMessages = messages.length;
    const delivered = messages.filter(m => m.status === 'delivered').length;
    const failed = messages.filter(m => m.status === 'failed').length;
    const deliveryRate = totalMessages ? (delivered / totalMessages) * 100 : 0;

    // 3️⃣ Recent activity (latest 5)
    const recent = await Message.findAll({
      where: { clientId },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [Channel],
    });

    const recentActivity = recent.map((m, i) => ({
      id: i + 1,
      title: 'Message broadcast sent',
      details: `Delivered to ${m.sentCount || 0} subscribers`,
      timeAgo: '2h ago', // you can calculate this dynamically
    }));

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalSubscribers,
          totalMessages,
          delivered,
          failed,
          deliveryRate: `${deliveryRate.toFixed(1)}%`,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error loading dashboard' });
  }
  };
 */ 
}