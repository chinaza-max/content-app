// ============================================
// src/services/email.service.ts
// ============================================
import { EmailTemplateService } from './email-template.service';
import { EmailResult } from '../types/email.types';

/**
 * Email Service - Wrapper for common email operations
 * Provides convenient methods for sending different types of emails
 */
export class EmailService {
  /**
   * Send OTP verification email
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @param otp - 6-digit OTP code
   * @returns EmailResult with success status and details
   */
  static async sendOTP(
    email: string,
    firstName: string,
    lastName: string,
    otp: string
  ): Promise<EmailResult> {
    return EmailTemplateService.sendOTPEmail(email, firstName, lastName, otp);
  }

  /**
   * Send welcome email after successful verification
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @returns EmailResult with success status and details
   */
  static async sendWelcomeEmail(
    email: string,
    firstName: string
  ): Promise<EmailResult> {
    return EmailTemplateService.sendWelcomeEmail(email, firstName);
  }

  /**
   * Send login notification email for security
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @param ipAddress - IP address of login
   * @param device - Device type (Desktop/Mobile/Tablet)
   * @param location - Geographic location (optional)
   * @returns EmailResult with success status and details
   */
  static async sendLoginNotification(
    email: string,
    firstName: string,
    ipAddress: string,
    device: string,
    location: string = 'Unknown'
  ): Promise<EmailResult> {
    return EmailTemplateService.sendLoginNotification(
      email,
      firstName,
      ipAddress,
      device,
      location
    );
  }

  /**
   * Send password reset email with reset code
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @param resetCode - Password reset code
   * @returns EmailResult with success status and details
   */
  static async sendPasswordReset(
    email: string,
    firstName: string,
    resetCode: string
  ): Promise<EmailResult> {
    return EmailTemplateService.sendPasswordResetEmail(email, firstName, resetCode);
  }

  /**
   * Send account created confirmation email
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @returns EmailResult with success status and details
   */
  static async sendAccountCreated(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<EmailResult> {
    return EmailTemplateService.sendAccountCreatedEmail(email, firstName, lastName);
  }

  /**
   * Get email sending statistics
   * @returns Statistics object with total, sent, failed, and pending counts
   */
  static async getEmailStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    return EmailTemplateService.getEmailStats();
  }

  /**
   * Get list of failed emails
   * @param limit - Maximum number of failed emails to retrieve (default: 50)
   * @returns Array of failed email logs
   */
  static async getFailedEmails(limit: number = 50) {
    return EmailTemplateService.getFailedEmails(limit);
  }

  /**
   * Retry sending failed emails
   * @param maxAttempts - Maximum number of retry attempts (default: 3)
   * @returns Promise that resolves when retry process is complete
   */
  static async retryFailedEmails(maxAttempts: number = 3): Promise<void> {
    return EmailTemplateService.retryFailedEmails(maxAttempts);
  }
}