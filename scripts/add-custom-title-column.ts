
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding customTitle column to sections table...');
    
    // Check if column already exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='sections' AND column_name='customTitle';
    ` as any[];
    
    if (result.length > 0) {
      console.log('✓ Column customTitle already exists');
      return;
    }
    
    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE "sections" ADD COLUMN "customTitle" TEXT;
    `;
    
    console.log('✓ Column customTitle added successfully');
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
