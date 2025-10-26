import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Channel from './channel.model';

// ==================================================
// INTERFACES
// ==================================================

/**
 * Describes the WhatsApp Route entity.
 * A route defines how a client's WhatsApp messages
 * are sent via a provider (e.g. Meta / WhatsApp Business API).
 */
export interface IWhatsAppRouteAttributes {
  id: number;
  clientId: number;
  channelId: number;
  provider: string;
  name: string;
  credentials?: Record<string, any> | null;
  encryptedConfig?: string | null;
  requestUrlTemplate?: string | null;
  requestMethod?: 'GET' | 'POST';
  headersTemplate?: string | null;
  bodyTemplate?: string | null;
  contentType?: 'application/json' | 'application/x-www-form-urlencoded';
  paramMapping?: Record<string, any> | null;
  successMatch?: string | null;
  webhookPath?: string | null;
  webhookSecretHash?: string | null;
  senderName?: string | null;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  forType: 'content' | 'bulkmessage';

}

/**
 * Defines which fields are optional when creating a WhatsApp route.
 */
export interface IWhatsAppRouteCreationAttributes
  extends Optional<
    IWhatsAppRouteAttributes,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'encryptedConfig'
    | 'credentials'
    | 'requestUrlTemplate'
    | 'headersTemplate'
    | 'bodyTemplate'
    | 'paramMapping'
    | 'successMatch'
    | 'webhookPath'
    | 'webhookSecretHash'
    | 'senderName'
    | 'isDefault'
  > {}

// ==================================================
// MODEL
// ==================================================

class WhatsAppRoute
  extends Model<IWhatsAppRouteAttributes, IWhatsAppRouteCreationAttributes>
  implements IWhatsAppRouteAttributes
{
  public id!: number;
  public clientId!: number;
  public channelId!: number;
  public provider!: string;
  public name!: string;
  public credentials!: Record<string, any> | null;
  public encryptedConfig!: string | null;
  public requestUrlTemplate!: string | null;
  public requestMethod!: 'GET' | 'POST';
  public headersTemplate!: string | null;
  public bodyTemplate!: string | null;
  public contentType!: 'application/json' | 'application/x-www-form-urlencoded';
  public paramMapping!: Record<string, any> | null;
  public successMatch!: string | null;
  public webhookPath!: string | null;
  public webhookSecretHash!: string | null;
  public senderName!: string | null;
  public isDefault!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public forType!: 'content' | 'bulkmessage';

}

WhatsAppRoute.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'The client that owns this WhatsApp route',
    },
    channelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'The channel linked to this WhatsApp route',
    },
    provider: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'e.g. Meta / WhatsApp Business API provider',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    encryptedConfig: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted credentials for the route',
    },
    requestUrlTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Dynamic URL template for sending WhatsApp messages',
    },
    requestMethod: {
      type: DataTypes.ENUM('GET', 'POST'),
      allowNull: false,
      defaultValue: 'POST',
    },
    headersTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bodyTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contentType: {
      type: DataTypes.ENUM('application/json', 'application/x-www-form-urlencoded'),
      allowNull: false,
      defaultValue: 'application/json',
    },
    paramMapping: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    successMatch: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    webhookPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    webhookSecretHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    senderName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    forType: {
      type: DataTypes.ENUM('content', 'bulkmessage'),
      defaultValue: 'content',
    }
  },
  {
    sequelize,
    tableName: 'whatsapp_routes',
    timestamps: true,
    indexes: [
      { fields: ['clientId'] },
      { unique: true, fields: ['channelId'] }, // ensures one WhatsApp route per channel
    ],
  }
);


export default WhatsAppRoute;
