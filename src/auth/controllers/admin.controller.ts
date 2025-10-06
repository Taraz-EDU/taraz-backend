import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RoleName } from '../../common/types/user.types';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Retrieve all users in the system. Requires admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Requires admin role.',
  })
  getAllUsers(@CurrentUser() user: CurrentUserData): {
    message: string;
    currentUser: CurrentUserData;
  } {
    return {
      message: `Hello ${user.firstName}, you have admin access to view all users`,
      currentUser: user,
    };
  }

  @Post('users/:userId/roles')
  @Roles(RoleName.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign roles to user (Super Admin only)',
    description: 'Assign new roles to a user. Requires super admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles assigned successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Requires super admin role.',
  })
  async assignRoles(
    @Param('userId') userId: string,
    @Body() body: { roles: RoleName[] },
    @CurrentUser() user: CurrentUserData
  ): Promise<{ message: string; assignedRoles: RoleName[] }> {
    await this.authService.assignRolesToUser(userId, body.roles);
    return {
      message: `Roles assigned successfully by ${user.firstName}`,
      assignedRoles: body.roles,
    };
  }

  @Get('profile')
  @Roles(RoleName.ADMIN, RoleName.TEACHER, RoleName.MENTOR, RoleName.MODERATOR)
  @ApiOperation({
    summary: 'Get admin profile',
    description: 'Get profile information for admin/staff users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  getAdminProfile(@CurrentUser() user: CurrentUserData): {
    message: string;
    profile: CurrentUserData;
    permissions: string[];
  } {
    return {
      message: `Welcome ${user.firstName}, you have admin/staff access`,
      profile: user,
      permissions: this.getUserPermissions(user.roles),
    };
  }

  private getUserPermissions(roles: string[]): string[] {
    const permissions: string[] = [];

    if (roles.includes(RoleName.SUPER_ADMIN)) {
      permissions.push('all');
    } else {
      if (roles.includes(RoleName.ADMIN)) {
        permissions.push('manage_users', 'manage_content', 'view_analytics');
      }
      if (roles.includes(RoleName.TEACHER)) {
        permissions.push('create_courses', 'manage_students', 'grade_assignments');
      }
      if (roles.includes(RoleName.MENTOR)) {
        permissions.push('guide_students', 'provide_feedback');
      }
      if (roles.includes(RoleName.MODERATOR)) {
        permissions.push('moderate_content', 'manage_forum');
      }
    }

    return permissions;
  }
}
