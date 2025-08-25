#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Database reset script - drops all tables and recreates them
 * WARNING: This will delete ALL data in the database!
 */

async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
    console.log('🗑️  Dropping all tables...');

    // Drop all tables in the correct order (respecting foreign key constraints)
    await prisma.$executeRaw`DROP TABLE IF EXISTS "PhotoSelection" CASCADE;`;
    console.log('✅ Dropped PhotoSelection table');

    await prisma.$executeRaw`DROP TABLE IF EXISTS "Photo" CASCADE;`;
    console.log('✅ Dropped Photo table');

    await prisma.$executeRaw`DROP TABLE IF EXISTS "User" CASCADE;`;
    console.log('✅ Dropped User table');

    // Drop the Prisma migration tracking table if it exists
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;`;
    console.log('✅ Dropped Prisma migrations table');

    console.log('');
    console.log('🎉 Database reset completed successfully!');
    console.log('💡 Next steps:');
    console.log('   1. Run "npm run db:push" to recreate tables');
    console.log('   2. Run "npm run db:seed:users" to seed users');
    console.log('   3. Run "npm run db:seed:photos" to seed photos');
    console.log('');
    console.log('🚀 Or run "npm run db:fresh" to do all steps automatically');
  } catch (error) {
    console.error('❌ Error during database reset:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
