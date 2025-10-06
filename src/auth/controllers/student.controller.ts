import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { UserService } from 'src/common/services/user.service';
import { type UserWithRoles } from 'src/common/types/user.types';

import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UpdateStudentProfileDto } from '../dto/update-student-profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Student')
@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class StudentController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get student profile' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.STUDENT)
  getProfile(@CurrentUser() user: UserWithRoles): UserWithRoles {
    return user;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update student profile' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.STUDENT)
  updateProfile(
    @CurrentUser() user: UserWithRoles,
    @Body() updateStudentProfileDto: UpdateStudentProfileDto
  ): Promise<UserWithRoles> {
    return this.userService.update(user.id, updateStudentProfileDto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get student dashboard' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.STUDENT)
  getDashboard(@CurrentUser() user: UserWithRoles): {
    message: string;
    data: { courses: never[]; assignments: never[]; grades: never[] };
  } {
    return {
      message: `Welcome to your dashboard, ${user.firstName}!`,
      data: {
        courses: [],
        assignments: [],
        grades: [],
      },
    };
  }

  @Get('courses')
  @ApiOperation({ summary: 'Get enrolled courses' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.STUDENT)
  getCourses(): { message: string; data: never[] } {
    return {
      message: 'Enrolled courses retrieved successfully.',
      data: [],
    };
  }

  @Get('grades')
  @ApiOperation({ summary: 'Get student grades' })
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.STUDENT)
  getGrades(): { message: string; data: never[] } {
    return {
      message: 'Grades retrieved successfully.',
      data: [],
    };
  }
}
