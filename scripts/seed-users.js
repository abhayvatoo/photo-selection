const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleUsers = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user-4',
    name: 'David Wilson',
    email: 'david@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user-5',
    name: 'Eve Brown',
    email: 'eve@example.com',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
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
