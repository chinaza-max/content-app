export enum EmailTemplate {
  OTP_VERIFICATION = 'otp-verification',
  WELCOME = 'welcome',
  LOGIN_NOTIFICATION = 'login-notification',
  PASSWORD_RESET = 'password-reset',
  ACCOUNT_CREATED = 'account-created',
}

export interface EmailPayload {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  template: EmailTemplate;
  recipient: string;
  timestamp: Date;
}

export interface EmailQueueItem {
  id: string;
  payload: EmailPayload;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}
