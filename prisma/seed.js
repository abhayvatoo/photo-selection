const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleUsers = [
  { name: 'Alice Johnson', email: 'alice@example.com', color: '#3b82f6' },
  { name: 'Bob Smith', email: 'bob@example.com', color: '#ef4444' },
  { name: 'Charlie Brown', email: 'charlie@example.com', color: '#10b981' },
  { name: 'Diana Prince', email: 'diana@example.com', color: '#f59e0b' },
  { name: 'Eve Wilson', email: 'eve@example.com', color: '#8b5cf6' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create users
  console.log('Creating users...');
  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✅ Created user: ${user.name} (${user.email})`);
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
