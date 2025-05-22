import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123'; // Change this to a secure password
  
  console.log(`Creating admin user with email: ${adminEmail}`);
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { role: 'admin' }
      ]
    }
  });
  
  if (existingAdmin) {
    console.log('Admin user already exists!');
    return;
  }
  
  // Hash password
  const hashedPassword = await hash(adminPassword, 10);
  
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  
  console.log(`Admin user created with ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 