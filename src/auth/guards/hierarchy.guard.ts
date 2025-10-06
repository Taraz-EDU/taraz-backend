import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role, RoleName } from '@prisma/client';
import { Observable } from 'rxjs';
import type { RequestWithUser } from 'src/common/types/user.types';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class HierarchyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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

    const userRoles: Role[] = user.userRoles?.map(userRole => userRole.role) ?? [];
    const userRoleNames: RoleName[] = userRoles.map(role => role.name);

    const hasRequiredRole = requiredRoles.some(requiredRole =>
      userRoleNames.includes(requiredRole)
    );

    if (!hasRequiredRole) {
      return false;
    }

    const targetUserRoleLevels = requiredRoles.map(
      roleName => userRoles.find(role => role.name === roleName)?.hierarchyLevel ?? 0
    );
    const userHighestRoleLevel = Math.max(...userRoles.map(role => role.hierarchyLevel));

    return targetUserRoleLevels.every(targetLevel => userHighestRoleLevel >= targetLevel);
  }
}
