import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// =============================
// 1️⃣ Define Interface
// =============================
export interface SMSRouteAttributes {
  id: number;
  clientId: number;
  provider: string;
  name: string;
  encryptedConfig?: string | null;
  requestUrlTemplate: string;
  requestMethod: 'POST' | 'GET' | 'PUT' | 'DELETE';
  headersTemplate?: string;
  bodyTemplate?: string;
  contentType?: string;
  paramMapping?: string;
  successMatch?: string;
  webhookPath?: string;
  webhookSecretHash?: string;
  senderId?: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  pricePerSms: number;
  forType: 'content' | 'bulksms';
  createdAt?: Date;
  updatedAt?: Date;
}

// =============================
// 2️⃣ Define Creation Interface
// =============================
export interface SMSRouteCreationAttributes
  extends Optional<SMSRouteAttributes, 'id' | 'encryptedConfig' | 'headersTemplate' | 'bodyTemplate' | 'contentType' | 'paramMapping' | 'successMatch' | 'webhookPath' | 'webhookSecretHash' | 'senderId' | 'isDefault' | 'status' | 'pricePerSms'> {}

// =============================
// 3️⃣ Define Model Class
// =============================
export class SMSRoute
  extends Model<SMSRouteAttributes, SMSRouteCreationAttributes>
  implements SMSRouteAttributes
{
  public id!: number;
  public clientId!: number;
  public provider!: string;
  public name!: string;
  public encryptedConfig?: string;
  public requestUrlTemplate!: string;
  public requestMethod!: 'POST' | 'GET' | 'PUT' | 'DELETE';
  public headersTemplate?: string;
  public bodyTemplate?: string;
  public contentType?: string;
  public paramMapping?: string;
  public successMatch?: string;
  public webhookPath?: string;
  public webhookSecretHash?: string;
  public senderId?: string;
  public isDefault!: boolean;
  public status!: 'active' | 'inactive';
  public pricePerSms!: number;
  public forType!: 'content' | 'bulksms';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// =============================
// 4️⃣ Initialize Model
// =============================
SMSRoute.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    clientId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false, unique: true},
    name: { type: DataTypes.STRING, allowNull: false, unique: true},
    encryptedConfig: { type: DataTypes.TEXT, allowNull: true },
    requestUrlTemplate: { type: DataTypes.TEXT, allowNull: false },
    requestMethod: {
      type: DataTypes.ENUM('POST', 'GET', 'PUT', 'DELETE'),
      defaultValue: 'POST',
    },
    headersTemplate: { type: DataTypes.TEXT, allowNull: true },
    bodyTemplate: { type: DataTypes.TEXT, allowNull: true },
    contentType: { type: DataTypes.STRING, allowNull: true },
    paramMapping: { type: DataTypes.TEXT, allowNull: true },
    successMatch: { type: DataTypes.STRING, allowNull: true },
    webhookPath: { type: DataTypes.STRING, allowNull: true },
    webhookSecretHash: { type: DataTypes.STRING, allowNull: true },
    senderId: { type: DataTypes.STRING, allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    pricePerSms: { type: DataTypes.FLOAT, defaultValue: 0.01 },
    forType: {
      type: DataTypes.ENUM('content', 'bulksms'),
      defaultValue: 'content',
    },
  },
  { sequelize, modelName: 'sms_route', tableName: 'sms_routes', timestamps: true }
);

export default SMSRoute;
