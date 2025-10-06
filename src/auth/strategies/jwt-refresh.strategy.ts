import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/common/services/user.service';
import { type UserWithRoles } from 'src/common/types/user.types';

import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('auth.refreshTokenSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserWithRoles> {
    const { sub: userId } = payload;
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User account is not active. Please contact support.');
    }

    return user;
  }
}
