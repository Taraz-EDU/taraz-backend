import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { UserService } from '../../common/services/user.service';
import { UserStatus } from '../../common/types/user.types';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    const secret = configService.get<string>('auth.jwtRefresh.secret') ?? 'fallback-refresh-secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtRefreshPayload): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    isEmailVerified: boolean;
  }> {
    const { sub: userId, email } = payload;

    const user = await this.userService.findUserById(userId);

    if (!user || user.email !== email) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Check token version for additional security (for now we'll skip this check)
    // In a real implementation, you might want to store tokenVersion in the user table

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
