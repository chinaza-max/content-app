import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { RouteType, MonetizationType, ChannelStatus } from "../enums/channel.enum";

export interface ChannelAttributes {
  id: number;
  name: string;
  description?: string;
  routeType: RouteType; // ✅ only one route type per channel
  monetizationType: MonetizationType;
  subscriptionFee: number;
  status: ChannelStatus;
  clientId?: number;
  smsRouteId?: number | null;
  whatsappRouteId?: number | null;
  emailRouteId?: number | null;
  metadata?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChannelCreationAttributes
  extends Optional<
    ChannelAttributes,
    | "id"
    | "description"
    | "subscriptionFee"
    | "metadata"
    | "clientId"
    | "smsRouteId"
    | "whatsappRouteId"
    | "emailRouteId"
    | "createdAt"
    | "updatedAt"
  > {}

export class Channel
  extends Model<ChannelAttributes, ChannelCreationAttributes>
  implements ChannelAttributes
{
  public id!: number;
  public name!: string;
  public description?: string;
  public routeType!: RouteType;
  public monetizationType!: MonetizationType;
  public subscriptionFee!: number;
  public status!: ChannelStatus;
  public clientId?: number;
  public smsRouteId?: number | null;
  public whatsappRouteId?: number | null;
  public emailRouteId?: number | null;
  public metadata?: object | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Channel.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    routeType: {
      type: DataTypes.ENUM(...Object.values(RouteType)),
      allowNull: false,
      defaultValue: RouteType.SMS,
      comment: "Defines the delivery route used by this channel",
    },
    monetizationType: {
      type: DataTypes.ENUM(...Object.values(MonetizationType)),
      allowNull: false,
      defaultValue: MonetizationType.FREE,
    },
    subscriptionFee: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ChannelStatus)),
      allowNull: false,
      defaultValue: ChannelStatus.ACTIVE,
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "clients", key: "id" },
      onDelete: "SET NULL",
    },
    smsRouteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "sms_routes", key: "id" },
      onDelete: "SET NULL",
    },
    whatsappRouteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "whatsapp_routes", key: "id" },
      onDelete: "SET NULL",
    },
    emailRouteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "email_routes", key: "id" },
      onDelete: "SET NULL",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "channel",
    tableName: "channels",
    timestamps: true,
  }
);

export default Channel;
