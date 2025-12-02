import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { RouteType } from '../enums/channel.enum';
import { SubscriberStatus } from '../enums/subscriber.enum';

class Subscriber extends Model {
  public id!: number;
  public name!: string;
  public phone!: string;
  public status!: SubscriberStatus;
  public subscriptionType!: RouteType;
  public metadata?: Record<string, any>;
}

Subscriber.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    subscriptionType: {
      type: DataTypes.ENUM(...Object.values(RouteType)),
      allowNull: false,
      defaultValue: RouteType.SMS,
      comment: 'Defines how the subscriber receives messages',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriberStatus)),
      allowNull: false,
      defaultValue: SubscriberStatus.PENDING,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Optional extra subscriber info (email, preferences, tags, etc.)',
    },
  },
  {
    sequelize,
    modelName: 'subscriber',
    tableName: 'subscribers',
    timestamps: true,
  }
);

export default Subscriber;
