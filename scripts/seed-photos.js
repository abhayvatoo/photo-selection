const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedPhotos() {
  try {
    console.log('🌱 Starting photo seeding...');

    // Get photos from bucket folder
    const bucketPath = path.join(__dirname, '..', 'bucket');

    if (!fs.existsSync(bucketPath)) {
      console.error('❌ Bucket folder not found at:', bucketPath);
      process.exit(1);
    }

    const photoFiles = fs.readdirSync(bucketPath).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    if (photoFiles.length === 0) {
      console.log('⚠️ No photo files found in bucket folder');
      return;
    }

    console.log(`📸 Found ${photoFiles.length} photos in bucket folder`);
    console.log('Creating photo records...');

    // Create photo records using Prisma - always insert new photos
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const fileStats = fs.statSync(path.join(bucketPath, file));
      const ext = path.extname(file).slice(1).toLowerCase();

      await prisma.photo.create({
        data: {
          filename: file,
          originalName: file,
          url: `/api/photos/serve/${file}`,
          mimeType: `image/${ext}`,
          size: fileStats.size,
        },
      });
    }

    console.log('✅ Photos created!');
    console.log('🎉 Photo seeding completed successfully!');
    console.log(`   - ${photoFiles.length} photos created`);
  } catch (error) {
    console.error('❌ Error during photo seeding:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedPhotos();
