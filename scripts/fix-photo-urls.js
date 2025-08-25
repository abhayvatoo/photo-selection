#!/usr/bin/env node

/**
 * Fix Photo URLs Script
 * Updates existing photo URLs from /uploads/filename.jpg to /api/uploads/filename.jpg
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Finding photos with old URL format...');
    
    // Find all photos with the old URL format
    const photosToUpdate = await prisma.photo.findMany({
      where: {
        url: {
          startsWith: '/uploads/'
        }
      },
      select: {
        id: true,
        url: true,
        filename: true
      }
    });
    
    console.log(`📸 Found ${photosToUpdate.length} photos to update`);
    
    if (photosToUpdate.length === 0) {
      console.log('✅ No photos need updating!');
      return;
    }
    
    // Update each photo URL
    let updatedCount = 0;
    for (const photo of photosToUpdate) {
      const newUrl = photo.url.replace('/uploads/', '/api/uploads/');
      
      await prisma.photo.update({
        where: { id: photo.id },
        data: { url: newUrl }
      });
      
      console.log(`✅ Updated: ${photo.filename} -> ${newUrl}`);
      updatedCount++;
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} photo URLs!`);
    
  } catch (error) {
    console.error('❌ Error updating photo URLs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);