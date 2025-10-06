import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from 'src/common/types/user.types';

export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = User>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}
