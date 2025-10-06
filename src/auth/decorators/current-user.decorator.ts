import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserWithRoles, RequestWithUser } from 'src/common/types/user.types';

export type CurrentUserData = UserWithRoles;

/**
 * A decorator to extract the current user from the request.
 *
 * @returns The current user object.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserWithRoles => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  }
);
