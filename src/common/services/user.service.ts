import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName, UserStatus, type User } from '@prisma/client';
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
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findUserByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
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
    return this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findUserByPasswordResetToken(token: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { passwordResetToken: token },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
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

  // Alias methods for backward compatibility and cleaner API
  async findById(id: string): Promise<UserWithRoles | null> {
    return this.findUserById(id);
  }

  async findByEmail(email: string): Promise<UserWithRoles | null> {
    return this.findUserByEmail(email);
  }

  async update(id: string, data: UpdateUserData): Promise<UserWithRoles> {
    return this.updateUser(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteUser(id);
  }

  async create(
    data: CreateUserData,
    roleNames: RoleName[],
    currentUser?: UserWithRoles
  ): Promise<UserWithRoles> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    if (currentUser) {
      await this.validateRoleCreation(currentUser, roleNames);
    }

    const user = await this.createUser(data);
    await this.assignRolesToUser(user.id, roleNames);

    const updatedUser = await this.findById(user.id);
    if (!updatedUser) {
      throw new NotFoundException('User not found after creation');
    }

    return updatedUser;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    updateData: { status: UserStatus },
    currentUser: UserWithRoles
  ): Promise<User> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const userRoles: RoleName[] = currentUser.userRoles.map(ur => ur.role.name);
    const targetRoles: RoleName[] = targetUser.userRoles.map(ur => ur.role.name);

    const canModify = await this.checkHierarchyPermission(userRoles, targetRoles);
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to modify this user');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: updateData.status },
    });
  }

  async assignRole(userId: string, roleName: RoleName): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    const existingUserRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    if (existingUserRole) {
      return;
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        assignedAt: new Date(),
      },
    });
  }

  async removeRole(userId: string, roleName: RoleName): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });
  }

  private async validateRoleCreation(
    currentUser: UserWithRoles,
    targetRoles: RoleName[]
  ): Promise<void> {
    const userHighestRole = this.getHighestRole(currentUser.userRoles);
    const rolesFromDb = await this.prisma.role.findMany({
      where: { name: { in: targetRoles } },
    });
    const targetHighestRole = this.getHighestRoleFromRoles(rolesFromDb);

    if (userHighestRole.hierarchyLevel < targetHighestRole.hierarchyLevel) {
      throw new ForbiddenException(
        'You do not have permission to create a user with the specified roles.'
      );
    }
  }

  private getHighestRole(userRoles: Array<{ role: { hierarchyLevel: number } }>): {
    hierarchyLevel: number;
  } {
    if (!userRoles || userRoles.length === 0) {
      return { hierarchyLevel: 0 };
    }
    return userRoles.reduce(
      (highest: { hierarchyLevel: number }, current) => {
        if (current.role.hierarchyLevel > highest.hierarchyLevel) {
          return current.role;
        }
        return highest;
      },
      { hierarchyLevel: 0 }
    );
  }

  private getHighestRoleFromRoles(roles: Array<{ hierarchyLevel: number }>): {
    hierarchyLevel: number;
  } {
    if (!roles || roles.length === 0) {
      return { hierarchyLevel: 0 };
    }
    return roles.reduce(
      (highest: { hierarchyLevel: number }, current) => {
        if (current.hierarchyLevel > highest.hierarchyLevel) {
          return current;
        }
        return highest;
      },
      { hierarchyLevel: 0 }
    );
  }

  private async checkHierarchyPermission(
    userRoles: RoleName[],
    targetRoles: RoleName[]
  ): Promise<boolean> {
    const userRolesFromDb = await this.prisma.role.findMany({
      where: { name: { in: userRoles } },
    });
    const targetRolesFromDb = await this.prisma.role.findMany({
      where: { name: { in: targetRoles } },
    });

    const userHighestLevel = this.getHighestRoleFromRoles(userRolesFromDb).hierarchyLevel;
    const targetHighestLevel = this.getHighestRoleFromRoles(targetRolesFromDb).hierarchyLevel;

    return userHighestLevel >= targetHighestLevel;
  }
}
