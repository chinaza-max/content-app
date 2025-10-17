import express, { Application } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { AdminService } from './services/admin.service';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());   

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Initialize database and server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await AdminService.createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || 'admin@yourapp.com'}`);
      console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;