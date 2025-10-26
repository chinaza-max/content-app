import { Request } from 'express';

export class DeviceUtil {
  static getDeviceInfo(req: Request): string {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    if (userAgent.includes('Mobile')) {
      return 'Mobile Device';
    } else if (userAgent.includes('Tablet')) {
      return 'Tablet';
    } else {
      return 'Desktop/Laptop';
    }
  }

  static getIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'Unknown'
    );
  }

  static getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'Unknown';
  }
}