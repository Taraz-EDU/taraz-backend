import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Create roles
  const roles = [
    {
      name: RoleName.SUPER_ADMIN,
      displayName: 'Super Administrator',
      description: 'Full system access with all privileges',
      hierarchyLevel: 100,
    },
    {
      name: RoleName.ADMIN,
      displayName: 'Administrator',
      description: 'Administrative access to the system',
      hierarchyLevel: 80,
    },
    {
      name: RoleName.MODERATOR,
      displayName: 'Moderator',
      description: 'Moderation privileges',
      hierarchyLevel: 60,
    },
    {
      name: RoleName.TEACHER,
      displayName: 'Teacher',
      description: 'Teaching staff with course management access',
      hierarchyLevel: 40,
    },
    {
      name: RoleName.MENTOR,
      displayName: 'Mentor',
      description: 'Mentorship and guidance role',
      hierarchyLevel: 30,
    },
    {
      name: RoleName.STUDENT,
      displayName: 'Student',
      description: 'Basic student access',
      hierarchyLevel: 10,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }

  // Roles seeded successfully
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    return prisma.$disconnect();
  });
