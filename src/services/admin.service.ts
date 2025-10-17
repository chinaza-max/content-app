import { Admin } from '../models';
import { BcryptUtil } from '../utils/bcrypt.util';
import { JwtUtil } from '../utils/jwt.util';

export class AdminService {
  static async login(email: string, password: string): Promise<string> {

    
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await BcryptUtil.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = JwtUtil.generateToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    });

    return token;
  }

  static async createDefaultAdmin(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourapp.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const hashedPassword = await BcryptUtil.hash(adminPassword);
      await Admin.create({
        email: adminEmail,
        password: hashedPassword,
      });
      console.log('✅ Default admin created');
    }
  }
}