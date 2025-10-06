import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EmailService } from '../common/services/email.service';
import { PrismaService } from '../common/services/prisma.service';
import { UserService } from '../common/services/user.service';

import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { StudentController } from './controllers/student.controller';
import { HierarchyGuard } from './guards/hierarchy.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './services/auth.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwt.secret') ?? 'fallback-secret',
        signOptions: {
          expiresIn: configService.get<string>('auth.jwt.expiresIn', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AdminController, StudentController],
  providers: [
    AuthService,
    EmailService,
    UserService,
    PrismaService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    HierarchyGuard,
  ],
  exports: [
    AuthService,
    UserService,
    JwtAuthGuard,
    RolesGuard,
    HierarchyGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
