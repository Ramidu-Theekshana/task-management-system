import { prisma } from '../src/db.js';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = 'admin@test.com';

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
      },
    });
    console.log(`Seeded admin user: ${admin.email}`);
  } else {
    console.log('Admin user already exists, skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
