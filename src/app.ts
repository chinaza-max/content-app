import express, { Application } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { AdminService } from './services/admin.service';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { MessageProcessorCron } from './services/factory.service';
import { sequelize } from './config/database'; // your Sequelize instance
import * as models from './models'; // adjust to your models folder
import { Model, IndexesOptions } from 'sequelize';

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

    const messageProcessorCron = new MessageProcessorCron
    messageProcessorCron.start();

async function clearDuplicateIndexes() {
  try {
    for (const modelName in models) {
      const model: typeof Model = (models as any)[modelName];

      if (!model || !model.tableName) continue;

      const tableName = model.tableName;
      console.log(`\n━━━ Analyzing table: ${tableName} ━━━`);

      // 1️⃣ Get all indexes with their columns
      const [indexes]: any = await sequelize.query(`SHOW INDEX FROM ${tableName};`);

      // 2️⃣ Get foreign key constraint names
      const [fks]: any = await sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = '${tableName}' 
           AND REFERENCED_TABLE_NAME IS NOT NULL;`
      );
      const fkConstraints = new Set(fks.map((fk: any) => fk.CONSTRAINT_NAME));

      // 3️⃣ Group indexes by their column combinations
      const indexGroups: Record<string, any[]> = {};
      
      indexes.forEach((idx: any) => {
        const key = idx.Key_name;
        if (!indexGroups[key]) {
          indexGroups[key] = [];
        }
        indexGroups[key].push(idx);
      });

      // 4️⃣ Create column signature for each index
      const indexSignatures: Record<string, {
        columns: string;
        indexName: string;
        isPrimary: boolean;
        isUnique: boolean;
        isFK: boolean;
      }> = {};

      for (const indexName in indexGroups) {
        const columns = indexGroups[indexName]
          .sort((a, b) => a.Seq_in_index - b.Seq_in_index)
          .map(idx => idx.Column_name)
          .join(',');

        indexSignatures[indexName] = {
          columns,
          indexName,
          isPrimary: indexName === 'PRIMARY',
          isUnique: indexGroups[indexName][0].Non_unique === 0,
          isFK: fkConstraints.has(indexName)
        };
      }

      // 5️⃣ Find duplicates by column signature
      const columnSignatureMap: Record<string, typeof indexSignatures[string][]> = {};
      
      for (const indexName in indexSignatures) {
        const sig = indexSignatures[indexName];
        const key = sig.columns;
        
        if (!columnSignatureMap[key]) {
          columnSignatureMap[key] = [];
        }
        columnSignatureMap[key].push(sig);
      }

      // 6️⃣ Decide which indexes to drop
      const indexesToDrop: string[] = [];

      for (const columnKey in columnSignatureMap) {
        const duplicates = columnSignatureMap[columnKey];
        
        if (duplicates.length <= 1) continue; // No duplicates

        console.log(`\n📋 Found ${duplicates.length} indexes on columns: ${columnKey}`);
        duplicates.forEach(d => {
          console.log(`   - ${d.indexName} (Primary: ${d.isPrimary}, Unique: ${d.isUnique}, FK: ${d.isFK})`);
        });

        // Prioritize which index to keep:
        // 1. PRIMARY KEY (always keep)
        // 2. UNIQUE indexes
        // 3. FK indexes
        // 4. Regular indexes

        duplicates.sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          if (a.isUnique && !b.isUnique) return -1;
          if (b.isUnique && !a.isUnique) return 1;
          if (a.isFK && !b.isFK) return -1;
          if (b.isFK && !a.isFK) return 1;
          return 0;
        });

        // Keep the first one (highest priority), drop the rest
        const toKeep = duplicates[0];
        console.log(`   ✅ Keeping: ${toKeep.indexName}`);

        for (let i = 1; i < duplicates.length; i++) {
          const toDrop = duplicates[i];
          
          // Don't drop FK constraints or PRIMARY
          if (toDrop.isFK || toDrop.isPrimary) {
            console.log(`   ⚠️  Skipping: ${toDrop.indexName} (FK or PRIMARY)`);
            continue;
          }

          console.log(`   ❌ Will drop: ${toDrop.indexName}`);
          indexesToDrop.push(toDrop.indexName);
        }
      }

      // 7️⃣ Drop the duplicate indexes
      for (const indexName of indexesToDrop) {
        try {
          console.log(`\n🗑️  Dropping index: ${indexName} from ${tableName}`);
          await sequelize.query(`ALTER TABLE ${tableName} DROP INDEX \`${indexName}\`;`);
          console.log(`   ✅ Dropped successfully`);
        } catch (err: any) {
          console.error(`   ❌ Failed to drop ${indexName}:`, err.message);
        }
      }

      if (indexesToDrop.length === 0) {
        console.log(`✨ No duplicate indexes found in ${tableName}`);
      } else {
        console.log(`\n🎉 Removed ${indexesToDrop.length} duplicate index(es) from ${tableName}`);
      }
    }

    console.log('\n\n✅ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Duplicate index cleanup completed!');
    console.log('✅ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('❌ Error clearing duplicate indexes:', err);
  }
}

// Run the function
//clearDuplicateIndexes();

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

//https://claude.ai/chat/f5abe635-1491-4ccc-8d8f-e03e7f3578ac