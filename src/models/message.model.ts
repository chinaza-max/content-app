import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { MESSAGE_CONTENT_TYPES } from "../types";

// ============================================================================
// INTERFACES - EXPORTED FOR USE THROUGHOUT THE APPLICATION
// ============================================================================

export interface MessageAttributes {
  id: number;
  direction: "inbound" | "outbound";
  type: "content" | "broadcast";
  content: string;
  contentType: "text" | "image" | "video" | "audio" | "document" | "location" | "interactive" | "template" | "both";
  status: "queue" | "processing" | "processed" | "failed";
  sentCount: number;
  failedCount: number;
  clientId?: number;
  channelId?: number;
  subscriberId?: number;
  parentMessageId?: number | null;
  recipients?: any;
  metadata?: object;
  responses?: any[];
  scheduledAt?: Date | null;
  
  // Template-specific fields
  templateName?: string | null;
  templateLanguage?: string | null;
  templateComponents?: any[] | null;
  
  // Media-specific fields
  mediaUrl?: string | null;
  mediaId?: string | null;
  caption?: string | null;
  filename?: string | null;
  
  // Location-specific fields
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  locationAddress?: string | null;
  
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
    | "templateName"
    | "templateLanguage"
    | "templateComponents"
    | "mediaUrl"
    | "mediaId"
    | "caption"
    | "filename"
    | "latitude"
    | "longitude"
    | "locationName"
    | "locationAddress"
  > {}

// ============================================================================
// MESSAGE MODEL
// ============================================================================

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  // Core fields
  public id!: number;
  public direction!: "inbound" | "outbound";
  public type!: "content" | "broadcast";
  public content!: string;
  public contentType!: "text" | "image" | "video" | "audio" | "document" | "location" | "template" | "interactive" | "both";
  public status!: "queue" | "processing" | "processed" | "failed";
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
  
  // Template fields
  public templateName?: string | null;
  public templateLanguage?: string | null;
  public templateComponents?: any[] | null;
  
  // Media fields
  public mediaUrl?: string | null;
  public mediaId?: string | null;
  public caption?: string | null;
  public filename?: string | null;
  
  // Location fields
  public latitude?: number | null;
  public longitude?: number | null;
  public locationName?: string | null;
  public locationAddress?: string | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Convert message to WhatsApp payload format
   */
  public toWhatsAppPayload(): any {
    const basePayload: any = {
      type: this.contentType,
    };

    switch (this.contentType) {
      case 'template':
        return {
          ...basePayload,
          templateName: this.templateName,
          templateLanguage: this.templateLanguage || 'en_US',
          templateComponents: this.templateComponents,
        };

      case 'text':
        return {
          ...basePayload,
          text: this.content,
        };

      case 'image':
        return {
          ...basePayload,
          mediaUrl: this.mediaUrl,
          mediaId: this.mediaId,
          caption: this.caption,
        };

      case 'video':
        return {
          ...basePayload,
          mediaUrl: this.mediaUrl,
          mediaId: this.mediaId,
          caption: this.caption,
        };

      case 'audio':
        return {
          ...basePayload,
          mediaUrl: this.mediaUrl,
          mediaId: this.mediaId,
        };

      case 'document':
        return {
          ...basePayload,
          mediaUrl: this.mediaUrl,
          mediaId: this.mediaId,
          filename: this.filename,
          caption: this.caption,
        };

      case 'location':
        return {
          ...basePayload,
          latitude: this.latitude,
          longitude: this.longitude,
          locationName: this.locationName,
          locationAddress: this.locationAddress,
        };

      case 'interactive':
        try {
          return {
            ...basePayload,
            interactive: JSON.parse(this.content),
          };
        } catch {
          throw new Error('Invalid interactive message format');
        }

      case 'both':
        return {
          ...basePayload,
          type: 'image',
          mediaUrl: this.mediaUrl,
          mediaId: this.mediaId,
          caption: this.content,
        };

      default:
        return {
          type: 'text',
          text: this.content,
        };
    }
  }

  /**
   * Get message statistics
   */
  public getStats() {
    return {
      total: this.sentCount + this.failedCount,
      sent: this.sentCount,
      failed: this.failedCount,
      successRate: this.sentCount + this.failedCount > 0 
        ? ((this.sentCount / (this.sentCount + this.failedCount)) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Check if message is ready to send
   */
  public isReadyToSend(): boolean {
    if (this.status !== 'queue') return false;
    if (!this.scheduledAt) return true;
    return new Date() >= this.scheduledAt;
  }

  /**
   * Mark as processing
   */
  public async markAsProcessing(): Promise<void> {
    await this.update({ status: 'processing' });
  }

  /**
   * Mark as processed with results
   */
  public async markAsProcessed(sentCount: number, failedCount: number, responses?: any[]): Promise<void> {
    await this.update({
      status: 'processed',
      sentCount,
      failedCount,
      responses,
    });
  }

  /**
   * Mark as failed
   */
  public async markAsFailed(error: string): Promise<void> {
    const metadata = (this.metadata as any) || {};
    await this.update({
      status: 'failed',
      failedCount: (this.failedCount || 0) + 1,
      metadata: {
        ...metadata,
        error,
        failedAt: new Date().toISOString(),
      },
    });
  }
}

// ============================================================================
// MODEL INITIALIZATION
// ============================================================================

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
      type: DataTypes.ENUM("content", "broadcast"),
      allowNull: false,
      defaultValue: "content",
    },
    contentType: {
      type: DataTypes.ENUM(
        ...MESSAGE_CONTENT_TYPES
      ),
      allowNull: false,
      defaultValue: "text",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("queue", "processing", "processed", "failed"),
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
      references: {
        model: 'clients',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    channelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'channels',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    subscriberId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'subscribers',
        key: 'id',
      },
      onDelete: 'SET NULL',
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
    
    // Template fields
    templateName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    templateLanguage: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'en_US',
    },
    templateComponents: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    
    // Media fields
    mediaUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mediaId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // Location fields
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    locationName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    locationAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "message",
    tableName: "messages",
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
      { fields: ['clientId'] },
      { fields: ['channelId'] },
      { fields: ['subscriberId'] },
      { fields: ['contentType'] },
      { fields: ['direction'] },
      { fields: ['createdAt'] },
      { 
        fields: ['status', 'scheduledAt'],
        name: 'idx_status_scheduled'
      },
    ],
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export default Message;