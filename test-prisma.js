const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  console.log('Testing Prisma connection...');
  
  // Try different connection approaches
  const configs = [
    // Default configuration
    {},
    // With explicit connection string
    {
      datasources: {
        db: {
          url: "postgresql://photo_user:photo_password@localhost:5432/photo_selection_db"
        }
      }
    },
    // With connection pooling disabled
    {
      datasources: {
        db: {
          url: "postgresql://photo_user:photo_password@localhost:5432/photo_selection_db?connection_limit=1"
        }
      }
    }
  ];

  for (let i = 0; i < configs.length; i++) {
    console.log(`\n--- Test ${i + 1}: ${i === 0 ? 'Default config' : i === 1 ? 'Explicit URL' : 'Single connection'} ---`);
    
    const prisma = new PrismaClient(configs[i]);
    
    try {
      // Test basic connection
      await prisma.$connect();
      console.log('✓ Connection established');
      
      // Test raw query first (this often works even when ORM queries fail)
      const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
      console.log('✓ Raw query successful:', rawResult);
      
      // Test ORM query
      const users = await prisma.user.findMany();
      console.log('✓ ORM query successful, users found:', users.length);
      
      break; // If we get here, it worked!
      
    } catch (error) {
      console.log('✗ Failed:', error.message);
      if (error.code) console.log('  Error code:', error.code);
    } finally {
      await prisma.$disconnect();
    }
  }
}

testPrismaConnection().catch(console.error);
