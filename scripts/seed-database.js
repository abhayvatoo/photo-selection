#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

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
    
    // Create users using Prisma
    console.log('👥 Creating users...');
    for (const userData of sampleUsers) {
      await prisma.user.upsert({
        where: { id: userData.id },
        update: {
          name: userData.name,
          color: userData.color,
        },
        create: {
          id: userData.id,
          name: userData.name,
          color: userData.color,
        },
      });
    }
    console.log('✅ Users created!');

    // Get photos from bucket folder
    const bucketPath = path.join(__dirname, '..', 'bucket');
    if (!fs.existsSync(bucketPath)) {
      console.log('⚠️  Bucket folder not found. Creating it...');
      fs.mkdirSync(bucketPath, { recursive: true });
      console.log('🎉 Database seeding completed (users only)!');
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

    // Create photo records using Prisma
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const fileStats = fs.statSync(path.join(bucketPath, file));
      const ext = path.extname(file).slice(1).toLowerCase();
      
      await prisma.photo.upsert({
        where: { id: `photo-${i + 1}` },
        update: {
          filename: file,
          originalName: file,
          url: `/api/photos/serve/${file}`,
          mimeType: `image/${ext}`,
          size: fileStats.size,
        },
        create: {
          id: `photo-${i + 1}`,
          filename: file,
          originalName: file,
          url: `/api/photos/serve/${file}`,
          mimeType: `image/${ext}`,
          size: fileStats.size,
        },
      });
    }
    
    console.log('✅ Photos created!');
    console.log('🎉 Database seeding completed successfully!');
    console.log(`   - ${sampleUsers.length} users created`);
    console.log(`   - ${photoFiles.length} photos created`);
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
