import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleName } from '@prisma/client';
import { Observable } from 'rxjs';
import type { RequestWithUser } from 'src/common/types/user.types';

import { ROLES_KEY } from '../decorators/roles.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoleNames: RoleName[] = user.userRoles?.map(userRole => userRole.role.name) ?? [];

    const hasRequiredRole = requiredRoles.some(role => userRoleNames.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `You do not have the required role(s) to access this resource. Required: ${requiredRoles.join(
          ', '
        )}`
      );
    }

    return true;
  }
}
