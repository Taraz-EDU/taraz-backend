import { UserStatus, RoleName } from '@prisma/client';

export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userRoles: {
    id: string;
    userId: string;
    roleId: string;
    isActive: boolean;
    assignedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    role: {
      id: string;
      name: RoleName;
      displayName: string;
      description: string | null;
      hierarchyLevel: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }[];
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  status?: UserStatus;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  status?: UserStatus;
  isEmailVerified?: boolean;
  emailVerificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  lastLoginAt?: Date | null;
}

export { UserStatus, RoleName };
