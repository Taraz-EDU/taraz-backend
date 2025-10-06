import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../common/services/prisma.service';
import { RoleName } from '../../common/types/user.types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class HierarchyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.roles ?? [];

    // Get role hierarchy information
    const allRoles = await this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { hierarchyLevel: 'desc' },
    });

    const roleHierarchy = new Map<string, number>();
    allRoles.forEach(role => {
      roleHierarchy.set(role.name, role.hierarchyLevel);
    });

    // Check if user has required role or higher level role
    const userRoleLevels = userRoles
      .map((role: string) => roleHierarchy.get(role))
      .filter((level: number | undefined): level is number => level !== undefined)
      .sort((a: number, b: number) => b - a); // Sort descending to get highest level

    const requiredRoleLevels = requiredRoles
      .map((role: RoleName) => roleHierarchy.get(role))
      .filter((level: number | undefined): level is number => level !== undefined);

    if (userRoleLevels.length === 0 || requiredRoleLevels.length === 0) {
      throw new ForbiddenException('Unable to determine role hierarchy');
    }

    const userHighestLevel = userRoleLevels[0] as number;
    const minRequiredLevel = Math.min(...requiredRoleLevels);

    if (userHighestLevel < minRequiredLevel) {
      throw new ForbiddenException(
        `Access denied. Required minimum hierarchy level: ${minRequiredLevel}. Your highest level: ${userHighestLevel}`
      );
    }

    return true;
  }
}
