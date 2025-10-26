import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IEmailLog {
  id?: number;
  recipient: string;
  template: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  errorMessage?: string;
  payload: object;
  attempts: number;
  sentAt?: Date;
  createdAt?: Date;
}

class EmailLog extends Model<IEmailLog> implements IEmailLog {
  public id!: number;
  public recipient!: string;
  public template!: string;
  public subject!: string;
  public status!: 'sent' | 'failed' | 'pending';
  public messageId?: string;
  public errorMessage?: string;
  public payload!: object;
  public attempts!: number;
  public sentAt?: Date;
  public readonly createdAt!: Date;
}

EmailLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    recipient: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    template: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('sent', 'failed', 'pending'),
      defaultValue: 'pending',
      allowNull: false,
    },
    messageId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'email_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['recipient'],
      },
      {
        fields: ['template'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default EmailLog;