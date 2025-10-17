import { Client, OTP } from '../models';
import { BcryptUtil } from '../utils/bcrypt.util';
import { JwtUtil } from '../utils/jwt.util';
import { EmailService } from './email.service';
import { Op } from 'sequelize';

export class ClientService {
  static async signup(email: string, password: string, firstName: string, lastName: string): Promise<void> {
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
      isVerified: false,
    });

    await this.sendVerificationOTP(email);
  }

  static async sendVerificationOTP(email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await OTP.destroy({ where: { email } });

    await OTP.create({
      email,
      otp,
      expiresAt,
    });

    await EmailService.sendOTP(email, otp);
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
}