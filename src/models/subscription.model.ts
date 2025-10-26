import { DataTypes, Model } from 'sequelize';
import {sequelize} from '../config/database';


class Subscription extends Model {}

Subscription.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  subscribedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'expired', 'pending'), defaultValue: 'pending' },
}, { sequelize, modelName: 'subscription' });


export default Subscription;
