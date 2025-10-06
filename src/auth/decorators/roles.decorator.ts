import { SetMetadata } from '@nestjs/common';

import type { RoleName } from '../../common/types/user.types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
