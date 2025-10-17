import { Request } from 'express';

export interface IAdmin {
  id?: number;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClient {
  id?: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOTP {
  id?: number;
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt?: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'client';
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
