import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { UserWithRoles, CreateUserData, UpdateUserData } from '../types/user.types';

import { PrismaService } from './prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserData): Promise<UserWithRoles> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user;
  }

  async findUserById(id: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithRoles | null;
  }

  async findUserByEmail(email: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithRoles | null;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<UserWithRoles> {
    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findUserByVerificationToken(token: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithRoles | null;
  }

  async findUserByPasswordResetToken(token: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: token },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithRoles | null;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async getActiveRoles(userId: string): Promise<RoleName[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: true,
      },
    });

    return userRoles.filter(userRole => userRole.role.isActive).map(userRole => userRole.role.name);
  }

  async assignRolesToUser(userId: string, roleNames: RoleName[]): Promise<void> {
    // Get role IDs
    const roles = await this.prisma.role.findMany({
      where: {
        name: { in: roleNames },
        isActive: true,
      },
    });

    if (roles.length !== roleNames.length) {
      const foundRoleNames = roles.map(role => role.name);
      const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
      throw new Error(`Invalid roles: ${missingRoles.join(', ')}`);
    }

    // Remove existing roles for this user
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    // Assign new roles
    await this.prisma.userRole.createMany({
      data: roles.map(role => ({
        userId,
        roleId: role.id,
        assignedAt: new Date(),
      })),
    });
  }

  getFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`;
  }
}
