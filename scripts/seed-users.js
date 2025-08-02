const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleUsers = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    color: '#FF6B6B',
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    color: '#4ECDC4',
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    color: '#45B7D1',
  },
  {
    id: 'user-4',
    name: 'David Wilson',
    color: '#96CEB4',
  },
  {
    id: 'user-5',
    name: 'Eve Brown',
    color: '#FFEAA7',
  },
];

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding...');
    console.log('👥 Creating users...');

    // Create users using upsert to avoid duplicates
    for (const userData of sampleUsers) {
      await prisma.user.upsert({
        where: { id: userData.id },
        update: userData,
        create: userData,
      });
    }
    
    console.log('✅ Users created!');
    console.log('🎉 User seeding completed successfully!');
    console.log(`   - ${sampleUsers.length} users created/updated`);
  } catch (error) {
    console.error('❌ Error during user seeding:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
