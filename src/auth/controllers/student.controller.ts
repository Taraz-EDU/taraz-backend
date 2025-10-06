import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RoleName } from '../../common/types/user.types';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Student')
@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentController {
  @Get('dashboard')
  @Roles(RoleName.STUDENT)
  @ApiOperation({
    summary: 'Student dashboard',
    description: 'Access student dashboard and courses.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard accessed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Requires student role.',
  })
  getDashboard(@CurrentUser() user: CurrentUserData): {
    message: string;
    student: CurrentUserData;
    courses: Array<{ id: number; name: string; progress: number }>;
    assignments: Array<{ id: number; title: string; dueDate: string; status: string }>;
  } {
    return {
      message: `Welcome ${user.firstName}, to your student dashboard`,
      student: user,
      courses: [
        { id: 1, name: 'Introduction to Programming', progress: 75 },
        { id: 2, name: 'Data Structures', progress: 45 },
        { id: 3, name: 'Algorithms', progress: 20 },
      ],
      assignments: [
        {
          id: 1,
          title: 'Homework 1',
          dueDate: '2024-01-15',
          status: 'completed',
        },
        {
          id: 2,
          title: 'Project 1',
          dueDate: '2024-01-20',
          status: 'in_progress',
        },
      ],
    };
  }

  @Get('courses')
  @Roles(RoleName.STUDENT)
  @ApiOperation({
    summary: 'Get student courses',
    description: 'Retrieve all courses for the student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
  })
  getCourses(@CurrentUser() user: CurrentUserData): {
    message: string;
    courses: Array<{
      id: number;
      name: string;
      instructor: string;
      progress: number;
      totalLessons: number;
      completedLessons: number;
    }>;
  } {
    return {
      message: `Courses for ${user.firstName}`,
      courses: [
        {
          id: 1,
          name: 'Introduction to Programming',
          instructor: 'Dr. Smith',
          progress: 75,
          totalLessons: 20,
          completedLessons: 15,
        },
        {
          id: 2,
          name: 'Data Structures and Algorithms',
          instructor: 'Prof. Johnson',
          progress: 45,
          totalLessons: 25,
          completedLessons: 11,
        },
      ],
    };
  }
}
