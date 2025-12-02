import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface IWhatsAppCredentialAttributes {
  id: number;
  provider: string;
  businessId?: string | null; // 👈 WhatsApp Business ID (Meta or provider-level)
  credentials?: string | null;
  encryptedConfig?: string | null;
  requestUrlTemplate?: string | null;
  headersTemplate?: string | null;
  bodyTemplate?: string | null;
  contentType?: 'application/json' | 'application/x-www-form-urlencoded';
  successMatch?: string | null;
  webhookSecretHash?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWhatsAppCredentialCreationAttributes
  extends Optional<
    IWhatsAppCredentialAttributes,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'businessId'
    | 'credentials'
    | 'encryptedConfig'
    | 'requestUrlTemplate'
    | 'headersTemplate'
    | 'bodyTemplate'
    | 'successMatch'
    | 'webhookSecretHash'
  > {}

class WhatsAppCredential
  extends Model<IWhatsAppCredentialAttributes, IWhatsAppCredentialCreationAttributes>
  implements IWhatsAppCredentialAttributes
{
  public id!: number;
  public provider!: string;
  public businessId!: string | null;
  public credentials!: string | null;
  public encryptedConfig!: string | null;
  public requestUrlTemplate!: string | null;
  public headersTemplate!: string | null;
  public bodyTemplate!: string | null;
  public contentType!: 'application/json' | 'application/x-www-form-urlencoded';
  public successMatch!: string | null;
  public webhookSecretHash!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WhatsAppCredential.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    provider: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Provider name, e.g. Meta / Twilio / 360Dialog / Infobip',
    },
    businessId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'WhatsApp Business ID from provider (e.g. Meta business ID)',
    },
    credentials: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted provider credentials',
    },
    encryptedConfig: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted credentials or secrets',
    },
    requestUrlTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    successMatch: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    webhookSecretHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'whatsapp_credentials',
    timestamps: true,
    indexes: [{ fields: ['provider'] }, { fields: ['businessId'] }],
  }
);

export default WhatsAppCredential;
