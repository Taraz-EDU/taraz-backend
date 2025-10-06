import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName, type User } from '@prisma/client';
import { UserService } from 'src/common/services/user.service';
import { type UserWithRoles } from 'src/common/types/user.types';

import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserRolesDto } from '../dto/update-user-roles.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { HierarchyGuard } from '../guards/hierarchy.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
@ApiBearerAuth('jwt')
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  getUsers(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.SUPER_ADMIN)
  createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: UserWithRoles
  ): Promise<User> {
    return this.userService.create(createUserDto, [RoleName.ADMIN], currentUser);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.TEACHER, RoleName.MENTOR, RoleName.MODERATOR)
  updateUserStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() currentUser: UserWithRoles
  ): Promise<User> {
    return this.userService.updateStatus(id, updateUserStatusDto, currentUser);
  }

  @Patch('users/:id/roles')
  @ApiOperation({ summary: 'Update user roles' })
  @HttpCode(HttpStatus.OK)
  async updateUserRoles(
    @Param('id') id: string,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
    @CurrentUser() currentUser: UserWithRoles
  ): Promise<UserWithRoles | null> {
    const { roles } = updateUserRolesDto;

    const rolePermissions: Partial<Record<RoleName, RoleName[]>> = {
      [RoleName.SUPER_ADMIN]: Object.values(RoleName),
      [RoleName.ADMIN]: [RoleName.TEACHER, RoleName.MENTOR, RoleName.MODERATOR, RoleName.STUDENT],
    };

    const userRoles: RoleName[] = currentUser.userRoles.map(userRole => userRole.role.name);
    const allowedRoles: RoleName[] = userRoles
      .map((role): RoleName[] => rolePermissions[role] ?? [])
      .flat();

    if (!roles.every(role => allowedRoles.includes(role))) {
      throw new ForbiddenException(
        'You do not have permission to assign one or more of the specified roles.'
      );
    }
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentRoles: RoleName[] = user.userRoles.map(userRole => userRole.role.name);

    const rolesToAdd: RoleName[] = roles.filter(role => !currentRoles.includes(role));
    const rolesToRemove: RoleName[] = currentRoles.filter(role => !roles.includes(role));

    await Promise.all([
      ...rolesToAdd.map(role => this.userService.assignRole(id, role)),
      ...rolesToRemove.map(role => this.userService.removeRole(id, role)),
    ]);

    return this.userService.findById(id);
  }
}
