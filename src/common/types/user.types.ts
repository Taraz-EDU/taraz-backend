import type { Prisma, User as PrismaUser, UserStatus, RoleName } from '@prisma/client';

export type User = PrismaUser;

export type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

export interface RequestWithUser extends Request {
  user: UserWithRoles;
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
  refreshToken?: string | null;
  accessToken?: string | null;
}

export { UserStatus, RoleName };
