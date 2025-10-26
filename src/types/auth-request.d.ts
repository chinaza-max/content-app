import { Request } from 'express';

export interface AuthUserPayload {
  id: number;
  email: string;
  role: 'admin' | 'client';
  [key: string]: any; // allow other JWT fields
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}
