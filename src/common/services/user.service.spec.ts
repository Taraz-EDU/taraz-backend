import { Test, type TestingModule } from '@nestjs/testing';
import { UserStatus, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from './prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let mockPrismaService: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    userRole: {
      create: jest.Mock;
      delete: jest.Mock;
    };
    role: {
      findUnique: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'password',
    firstName: 'Test',
    lastName: 'User',
    status: UserStatus.ACTIVE,
    roles: [
      {
        role: {
          name: RoleName.STUDENT,
        },
      },
    ],
  };

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
        delete: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const userId = 'user-id';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findById(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should return null if user not found', async () => {
      const userId = 'user-id';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await userService.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser, mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toEqual(users);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };
      const hashedPassword = 'hashed-password';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);

      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue({
        id: 'student-role-id',
        name: RoleName.STUDENT,
        hierarchyLevel: 1,
      });

      const result = await userService.create(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: hashedPassword,
          roles: {
            create: {
              role: {
                connect: {
                  name: RoleName.STUDENT,
                },
              },
            },
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'user-id';
      const userData = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, ...userData };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await userService.update(userId, userData);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: userData,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const userId = 'user-id';
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await userService.delete(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      const userId = 'user-id';
      const roleName = RoleName.STUDENT;

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue({
        id: 'role-id',
        name: roleName,
        hierarchyLevel: 1,
      });
      mockPrismaService.userRole.create.mockResolvedValue({});

      await userService.assignRole(userId, roleName);

      expect(mockPrismaService.userRole.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: userId } },
          role: { connect: { name: roleName } },
        },
      });
    });

    it('should throw an error if user does not exist', async () => {
      const userId = 'user-id';
      const roleName = RoleName.STUDENT;

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(userService.assignRole(userId, roleName)).rejects.toThrow('User not found');
    });

    it('should throw an error if role does not exist', async () => {
      const userId = 'user-id';
      const roleName = RoleName.STUDENT;

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(userService.assignRole(userId, roleName)).rejects.toThrow('Role not found');
    });
  });
});
