import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../common/services/prisma.service';

export class TestResponseDto<T = unknown> {
  message!: string;
  timestamp!: string;
  data?: T;
}

export class TestRequestDto {
  name!: string;
  email!: string;
}

class GetTestDataDto {
  environment!: string;
  nodeVersion!: string;
  uptime!: number;
  databaseConnected!: boolean;
  roleCount!: number;
}

class GetTestByIdDataDto {
  id!: string;
  status!: string;
  createdAt!: string;
}

class CreateTestDataDto extends TestRequestDto {
  id!: string;
  status!: string;
}

@ApiTags('Test')
@Controller('test')
export class TestController {
  constructor(private readonly prisma: PrismaService) {}
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get test message' })
  @ApiResponse({
    status: 200,
    description: 'Test message retrieved successfully',
    type: TestResponseDto,
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Optional name parameter',
  })
  async getTest(@Query('name') name?: string): Promise<TestResponseDto<GetTestDataDto>> {
    // Test database connection by counting roles
    const roleCount = await this.prisma.role.count();

    return {
      message: `Hello ${name ?? 'World'}! This is a test endpoint.`,
      timestamp: new Date().toISOString(),
      data: {
        environment: process.env['NODE_ENV'] ?? 'development',
        nodeVersion: process.version,
        uptime: process.uptime(),
        databaseConnected: true,
        roleCount,
      },
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get test by ID' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'Test data retrieved successfully',
    type: TestResponseDto,
  })
  getTestById(@Param('id') id: string): TestResponseDto<GetTestByIdDataDto> {
    return {
      message: `Test data for ID: ${id}`,
      timestamp: new Date().toISOString(),
      data: {
        id,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create test data' })
  @ApiBody({ type: TestRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Test data created successfully',
    type: TestResponseDto,
  })
  createTest(@Body() testData: TestRequestDto): TestResponseDto<CreateTestDataDto> {
    return {
      message: 'Test data created successfully',
      timestamp: new Date().toISOString(),
      data: {
        ...testData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'created',
      },
    };
  }
}
