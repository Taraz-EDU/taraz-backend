import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { UserService } from '../../common/services/user.service';
import { UserStatus } from '../../common/types/user.types';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    const secret = configService.get<string>('auth.jwt.secret') ?? 'fallback-secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    isEmailVerified: boolean;
    roles: string[];
  }> {
    const { sub: userId, email } = payload;

    const user = await this.userService.findUserById(userId);

    if (!user || user.email !== email) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Get active roles
    const activeRoles = await this.userService.getActiveRoles(user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      roles: activeRoles,
    };
  }
}
