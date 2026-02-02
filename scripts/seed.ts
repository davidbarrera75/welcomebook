import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.media.deleteMany();
  await prisma.section.deleteMany();
  await prisma.welcomebook.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await hash('admin123456', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@welcomebook.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create sample welcomebook
  const welcomebook = await prisma.welcomebook.create({
    data: {
      propertyName: 'Mi Glamping Paradise',
      slug: 'mi-glamping',
      userId: admin.id,
    },
  });

  // Create sample sections
  const section1 = await prisma.section.create({
    data: {
      welcomebookId: welcomebook.id,
      type: 'WIFI',
      customTitle: 'Wi-Fi Information',
      order: 1,
      data: {
        ssid: 'GlampingWiFi',
        password: 'password123',
        frequency: '5GHz',
      },
    },
  });

  const section2 = await prisma.section.create({
    data: {
      welcomebookId: welcomebook.id,
      type: 'HOST',
      customTitle: 'Host Information',
      order: 2,
      data: {
        name: 'John Doe',
        email: 'host@example.com',
        phone: '+1234567890',
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created user: ${admin.email}`);
  console.log(`Created welcomebook: ${welcomebook.propertyName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
