import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UserStatus, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import type { UserWithRoles, CreateUserData, UpdateUserData } from '../types/user.types';

import { PrismaService } from './prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser: UserWithRoles = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userRoles: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userRole: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
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

    service = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService);

    // Mock bcrypt
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const userData: CreateUserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: 'hashedPassword',
        },
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

  describe('findUserById', () => {
    it('should return user when found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findUserById('1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should return null when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findUserById('999');

      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should return user when found by email', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
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

  describe('updateUser', () => {
    it('should update user without password', async () => {
      const updateData: UpdateUserData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      const result = await service.updateUser('1', updateData);

      expect(result).toEqual({ ...mockUser, ...updateData });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should hash password when updating password', async () => {
      const updateData: UpdateUserData = {
        password: 'newPassword123',
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      await service.updateUser('1', updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          password: 'hashedPassword',
        },
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

  describe('validatePassword', () => {
    it('should validate password correctly', async () => {
      const result = await service.validatePassword('password123', 'hashedPassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });
  });

  describe('getActiveRoles', () => {
    it('should return active roles for user', async () => {
      const mockUserRoles = [
        {
          id: '1',
          userId: '1',
          roleId: '1',
          isActive: true,
          assignedAt: new Date(),
          expiresAt: null,
          createdAt: new Date(),
          role: {
            id: '1',
            name: RoleName.ADMIN,
            displayName: 'Administrator',
            description: 'Admin role',
            hierarchyLevel: 80,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const result = await service.getActiveRoles('1');

      expect(result).toEqual([RoleName.ADMIN]);
      expect(prismaService.userRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: '1',
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        include: {
          role: true,
        },
      });
    });
  });

  describe('getFullName', () => {
    it('should return full name correctly', () => {
      const result = service.getFullName('John', 'Doe');
      expect(result).toBe('John Doe');
    });
  });
});
