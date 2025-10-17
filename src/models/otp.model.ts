
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { IOTP } from '../types';

class OTP extends Model<IOTP> implements IOTP {
  public id!: number;
  public email!: string;
  public otp!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
}

OTP.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'otps',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['email'],
      },
      {
        fields: ['expiresAt'],
      },
    ],
  }
);

// Auto-delete expired OTPs every 5 minutes
setInterval(async () => {
  try {
    await OTP.destroy({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error deleting expired OTPs:', error);
  }
}, 5 * 60 * 1000);

export default OTP;