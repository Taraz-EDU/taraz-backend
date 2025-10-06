import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  isEmailVerified: boolean;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
