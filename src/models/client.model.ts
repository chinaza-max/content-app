// ============================================
// TYPES INTERFACE
// ============================================
import { PurposeEnum, ACCOUNT_TYPE_ENUM, PURPOSE_ENUM, AccountTypeEnum } from '../constants/client.enums';
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IClientAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  purpose: PurposeEnum; // ✅ Now typed from constants
  accountType: AccountTypeEnum;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClientCreationAttributes
  extends Omit<IClientAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// ============================================
// CLIENT MODEL
// ============================================
class Client
  extends Model<IClientAttributes, IClientCreationAttributes>
  implements IClientAttributes
{
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public purpose!: PurposeEnum;
  public accountType!: AccountTypeEnum;
  public isVerified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Client.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM(...PURPOSE_ENUM), // ✅ imported enum array
      allowNull: false,
      comment: 'Platform usage purpose: content creation, bulk SMS, or both',
    },
    accountType: {
      type: DataTypes.ENUM(...ACCOUNT_TYPE_ENUM), // ✅ imported enum array
      allowNull: false,
      comment: 'Account type: individual or organization',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'clients',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['isVerified'] },
      { fields: ['purpose'] },
      { fields: ['accountType'] },
    ],
  }
);

export default Client;
