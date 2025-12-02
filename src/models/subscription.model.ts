import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export enum SubscriptionPlan {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

class Subscription extends Model {
  public id!: number;
  public subscriberId!: number;
  public channelId!: number;
  public plan!: SubscriptionPlan;
  public status!: SubscriptionStatus;
  public subscribedAt!: Date;
  public expiresAt?: Date;
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    subscriberId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    channelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    plan: {
      type: DataTypes.ENUM(...Object.values(SubscriptionPlan)),
      allowNull: false,
      defaultValue: SubscriptionPlan.MONTHLY,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
      allowNull: false,
      defaultValue: SubscriptionStatus.PENDING,
    },
    subscribedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'subscription',
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['subscriberId', 'channelId'], // ✅ Ensure one subscription per channel per subscriber
      },
    ],
  }
);

export default Subscription;
