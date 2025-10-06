import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  override handleRequest(err: Error | null, user: unknown): unknown {
    if (err ?? !user) {
      throw err ?? new UnauthorizedException('Invalid or expired refresh token');
    }
    return user;
  }
}
