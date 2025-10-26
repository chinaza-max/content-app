import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface MessageAttributes {
  id: number;
  direction: "inbound" | "outbound";
  type: "content" | "broadcast" ;
  content: string;
  contentType: "text" | "image" | "video" | "audio" | "document" | "location" | "both";
  status: "queue" | "processing" | "processed";
  sentCount: number;
  failedCount: number;
  clientId?: number;
  channelId?: number;
  subscriberId?: number;
  parentMessageId?: number | null;
  recipients?: any;
  metadata?: object;
  responses?: any[];
  scheduledAt?: Date | null; // 👈 new field
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MessageCreationAttributes
  extends Optional<
    MessageAttributes,
    | "id"
    | "status"
    | "sentCount"
    | "failedCount"
    | "metadata"
    | "parentMessageId"
    | "recipients"
    | "responses"
    | "scheduledAt"
  > {}

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: number;
  public direction!: "inbound" | "outbound";
  public type!: "content" | "broadcast" ;
  public content!: string;
  public contentType!: "text" | "image" | "video" | "audio" | "document" | "location" | "both";
  public status!: "queue" | "processing" | "processed";
  public sentCount!: number;
  public failedCount!: number;
  public clientId?: number;
  public channelId?: number;
  public subscriberId?: number;
  public parentMessageId?: number | null;
  public recipients?: any;
  public metadata?: object;
  public responses?: any[];
  public scheduledAt?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    direction: {
      type: DataTypes.ENUM("inbound", "outbound"),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("content", "broadcast", "direct"),
      allowNull: false,
      defaultValue: "content",
    },
    contentType: {
      type: DataTypes.ENUM("text", "image", "video", "audio", "document", "location", "both"),
      allowNull: false,
      defaultValue: "text",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("queue", "processing", "processed"),
      allowNull: false,
      defaultValue: "queue",
    },
    sentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    failedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    channelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    subscriberId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    parentMessageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "messages",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    recipients: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    responses: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "message",
    tableName: "messages",
    timestamps: true,
  }
);

export default Message;
