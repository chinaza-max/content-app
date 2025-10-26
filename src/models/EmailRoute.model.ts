// models/EmailRoute.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class EmailRoute extends Model {}

EmailRoute.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,  // 👈 Must match channels.emailRouteId
    autoIncrement: true,
    primaryKey: true,
  },
  name: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'email_route',
  tableName: 'email_routes',
  timestamps: false,
});

export default EmailRoute;
