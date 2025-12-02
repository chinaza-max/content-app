import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface IWhatsAppRouteAttributes {
  id: number;
  name: string;
  metaPhoneId?: string | null;
  phoneNumber?: string | null;
  senderName?: string | null;
  status?: 'active' | 'inactive';
  isDefault?: boolean;
  forType: 'content' | 'bulkmessage';
  rateLimitPerSec?: number | null;
  dailyQuota?: number | null;
  usageCount?: number | null;
  lastUsedAt?: Date | null;
  webhookPath?: string | null;
  credentialId: number;
  clientId: number; // 👈 added
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWhatsAppRouteCreationAttributes
  extends Optional<IWhatsAppRouteAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'isDefault' | 'usageCount' | 'lastUsedAt'> {}

class WhatsAppRoute
  extends Model<IWhatsAppRouteAttributes, IWhatsAppRouteCreationAttributes>
  implements IWhatsAppRouteAttributes
{
  public id!: number;
  public name!: string;
  public metaPhoneId!: string | null;
  public phoneNumber!: string | null;
  public senderName!: string | null;
  public status!: 'active' | 'inactive';
  public isDefault!: boolean;
  public forType!: 'content' | 'bulkmessage';
  public rateLimitPerSec!: number | null;
  public dailyQuota!: number | null;
  public usageCount!: number | null;
  public lastUsedAt!: Date | null;
  public webhookPath!: string | null;
  public credentialId!: number;
  public clientId!: number; 
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WhatsAppRoute.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    metaPhoneId: DataTypes.STRING(100),
    phoneNumber: DataTypes.STRING(30),
    senderName: DataTypes.STRING(100),
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    forType: {
      type: DataTypes.ENUM('content', 'bulkmessage'),
      allowNull: false,
      defaultValue: 'content',
    },
    rateLimitPerSec: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1,
    },
    dailyQuota: DataTypes.INTEGER.UNSIGNED,
    usageCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    lastUsedAt: DataTypes.DATE,
    webhookPath: {
      type: DataTypes.STRING,
      unique: true,
    },
    credentialId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'whatsapp_credentials',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'whatsapp_routes',
    timestamps: true,
    indexes: [
      { fields: ['credentialId'] },
      { fields: ['phoneNumber'] },
      { fields: ['clientId'] },
    ],
  }
);

export default WhatsAppRoute;
