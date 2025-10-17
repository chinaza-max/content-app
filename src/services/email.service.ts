import { transporter, emailConfig } from '../config/email';

export class EmailService {
  static async sendOTP(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Your OTP for Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome ${name}!</h2>
          <p>Your account has been successfully verified.</p>
          <p>Thank you for joining us!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }
}