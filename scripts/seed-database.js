#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const sampleUsers = [
  { id: 'user-1', name: 'Alice', color: '#FF6B6B' },
  { id: 'user-2', name: 'Bob', color: '#4ECDC4' },
  { id: 'user-3', name: 'Charlie', color: '#45B7D1' },
  { id: 'user-4', name: 'Diana', color: '#96CEB4' },
  { id: 'user-5', name: 'Eve', color: '#FFEAA7' }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    
    // First, create the tables if they don't exist
    console.log('📋 Creating database tables...');
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS "User" (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS "Photo" (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          "originalName" TEXT NOT NULL,
          url TEXT NOT NULL,
          "mimeType" TEXT NOT NULL,
          size INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS "PhotoSelection" (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "photoId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PhotoSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "PhotoSelection_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"(id) ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS "PhotoSelection_userId_photoId_key" ON "PhotoSelection"("userId", "photoId");
    `;
    
    await execAsync(`docker exec -i photo-selection-db psql -U photo_user -d photo_selection_db -c "${createTablesSQL.replace(/"/g, '\\"')}"`); 
    console.log('✅ Tables created!');
    
    // Create users using direct SQL
    console.log('👥 Creating users...');
    for (const user of sampleUsers) {
      const insertUserSQL = `
        INSERT INTO "User" (id, name, color, "createdAt", "updatedAt") 
        VALUES ('${user.id}', '${user.name}', '${user.color}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          color = EXCLUDED.color,
          "updatedAt" = CURRENT_TIMESTAMP;
      `;
      
      await execAsync(`docker exec -i photo-selection-db psql -U photo_user -d photo_selection_db -c "${insertUserSQL.replace(/"/g, '\\"')}"`); 
    }
    console.log('✅ Users created!');

    // Get photos from bucket folder
    const bucketPath = path.join(__dirname, '..', 'bucket');
    if (!fs.existsSync(bucketPath)) {
      console.log('⚠️  Bucket folder not found. Creating it...');
      fs.mkdirSync(bucketPath, { recursive: true });
      return;
    }
    
    const photoFiles = fs.readdirSync(bucketPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });

    if (photoFiles.length === 0) {
      console.log('⚠️  No photos found in bucket folder. Add some photos to bucket/ for testing.');
      console.log('🎉 Database seeding completed (users only)!');
      return;
    }

    console.log(`📸 Found ${photoFiles.length} photos in bucket folder`);
    console.log('Creating photo records...');

    // Create photo records using direct SQL
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const fileStats = fs.statSync(path.join(bucketPath, file));
      const ext = path.extname(file).slice(1).toLowerCase();
      
      const insertPhotoSQL = `
        INSERT INTO "Photo" (id, filename, "originalName", url, "mimeType", size, "createdAt", "updatedAt") 
        VALUES ('photo-${i + 1}', '${file}', '${file}', '/api/photos/serve/${file}', 'image/${ext}', ${fileStats.size}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET 
          filename = EXCLUDED.filename,
          "originalName" = EXCLUDED."originalName",
          url = EXCLUDED.url,
          "mimeType" = EXCLUDED."mimeType",
          size = EXCLUDED.size,
          "updatedAt" = CURRENT_TIMESTAMP;
      `;
      
      await execAsync(`docker exec -i photo-selection-db psql -U photo_user -d photo_selection_db -c "${insertPhotoSQL.replace(/"/g, '\\"')}"`); 
    }
    
    console.log('✅ Photos created!');
    console.log('🎉 Database seeding completed successfully!');
    console.log(`   - ${sampleUsers.length} users created`);
    console.log(`   - ${photoFiles.length} photos created`);
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

seedDatabase();
