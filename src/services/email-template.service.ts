// ============================================
// src/services/email-template.service.ts - COMPLETE
// ============================================
import ejs from 'ejs';
import path from 'path';
import { transporter, emailConfig } from '../config/email';
import { EmailTemplate, EmailPayload, EmailResult } from '../types/email.types';
import EmailLog from '../models/email-log.model';
import { Op } from 'sequelize';

export class EmailTemplateService {
  private static templatePath = path.join(__dirname, '../templates/emails');

  /**
   * Render email template with data
   */
  private static async renderTemplate(
    template: EmailTemplate,
    data: Record<string, any>
  ): Promise<string> {
    const templateFile = path.join(this.templatePath, `${template}.ejs`);
    
    // Add default data
    const templateData = {
      ...data,
      appName: process.env.APP_NAME || 'MVC App',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yourapp.com',
      currentYear: new Date().getFullYear(),
    };

    try {
      const html = await ejs.renderFile(templateFile, templateData);
      return html;
    } catch (error: any) {
      throw new Error(`Failed to render template ${template}: ${error.message}`);
    }
  }

  /**
   * Send email using template
   */
  static async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    let logId: number | undefined;

    try {
      // Create email log entry
      const log = await EmailLog.create({
        recipient: payload.to,
        template: payload.template,
        subject: payload.subject,
        status: 'pending',
        payload: payload.data,
        attempts: 1,
      });
      logId = log.id;

      // Render template
      const html = await this.renderTemplate(payload.template, payload.data);

      // Send email
      const info = await transporter.sendMail({
        from: emailConfig.from,
        to: payload.to,
        subject: payload.subject,
        html: html,
      });

      // Update log as successful
      await EmailLog.update(
        {
          status: 'sent',
          messageId: info.messageId,
          sentAt: new Date(),
        },
        { where: { id: logId } }
      );

      console.log(`✅ Email sent successfully: ${payload.template} to ${payload.to}`);

      return {
        success: true,
        messageId: info.messageId,
        template: payload.template,
        recipient: payload.to,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      
      // Update log as failed
      if (logId) {
        await EmailLog.update(
          {
            status: 'failed',
            errorMessage: errorMessage,
          },
          { where: { id: logId } }
        );
      }

      console.error(`❌ Email failed: ${payload.template} to ${payload.to}`, error);

      return {
        success: false,
        error: errorMessage,
        template: payload.template,
        recipient: payload.to,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send OTP verification email
   */
  static async sendOTPEmail(
    email: string,
    firstName: string,
    lastName: string,
    otp: string
  ): Promise<EmailResult> {
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

    return this.sendEmail({
      to: email,
      subject: 'Email Verification - OTP Code',
      template: EmailTemplate.OTP_VERIFICATION,
      data: {
        firstName,
        lastName,
        otp,
        expiryMinutes,
      },
    });
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(
    email: string,
    firstName: string
  ): Promise<EmailResult> {
    const loginUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/client/login`;

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${process.env.APP_NAME || 'MVC App'}!`,
      template: EmailTemplate.WELCOME,
      data: {
        firstName,
        loginUrl,
      },
    });
  }

  /**
   * Send login notification email
   */
  static async sendLoginNotification(
    email: string,
    firstName: string,
    ipAddress: string,
    device: string,
    location: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'New Login to Your Account',
      template: EmailTemplate.LOGIN_NOTIFICATION,
      data: {
        firstName,
        loginTime: new Date().toLocaleString(),
        ipAddress,
        device,
        location,
      },
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetCode: string
  ): Promise<EmailResult> {
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: EmailTemplate.PASSWORD_RESET,
      data: {
        firstName,
        resetCode,
        expiryMinutes,
      },
    });
  }

  /**
   * Send account created email
   */
  static async sendAccountCreatedEmail(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Account Created Successfully',
      template: EmailTemplate.ACCOUNT_CREATED,
      data: {
        firstName,
        lastName,
      },
    });
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    try {
      const [total, sent, failed, pending] = await Promise.all([
        EmailLog.count(),
        EmailLog.count({ where: { status: 'sent' } }),
        EmailLog.count({ where: { status: 'failed' } }),
        EmailLog.count({ where: { status: 'pending' } }),
      ]);

      return { total, sent, failed, pending };
    } catch (error) {
      console.error('Error getting email stats:', error);
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }

  /**
   * Get failed emails
   */
  static async getFailedEmails(limit: number = 50): Promise<EmailLog[]> {
    try {
      return await EmailLog.findAll({
        where: { status: 'failed' },
        order: [['createdAt', 'DESC']],
        limit,
      });
    } catch (error) {
      console.error('Error getting failed emails:', error);
      return [];
    }
  }

  /**
   * Retry failed emails
   */
  static async retryFailedEmails(maxAttempts: number = 3): Promise<void> {
    try {
      const failedEmails = await EmailLog.findAll({
        where: {
          status: 'failed',
          attempts: {
            [Op.lt]: maxAttempts,
          },
        },
        limit: 10,
      });

      console.log(`🔄 Retrying ${failedEmails.length} failed emails...`);

      for (const log of failedEmails) {
        try {
          // Increment attempt count
          await EmailLog.update(
            { attempts: log.attempts + 1 },
            { where: { id: log.id } }
          );

          // Retry sending
          const result = await this.sendEmail({
            to: log.recipient,
            subject: log.subject,
            template: log.template as EmailTemplate,
            data: log.payload as Record<string, any>,
          });

          if (result.success) {
            console.log(`✅ Retry successful for email ID: ${log.id}`);
          }
        } catch (error) {
          console.error(`❌ Retry failed for email ID: ${log.id}`, error);
        }
      }
    } catch (error) {
      console.error('Error retrying failed emails:', error);
    }
  }
}