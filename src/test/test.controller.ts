import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

export class TestResponseDto {
  message: string;
  timestamp: string;
  data?: any;
}

export class TestRequestDto {
  name: string;
  email: string;
}

@ApiTags('Test')
@Controller('test')
export class TestController {
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
  getTest(@Query('name') name?: string): TestResponseDto {
    return {
      message: `Hello ${name || 'World'}! This is a test endpoint.`,
      timestamp: new Date().toISOString(),
      data: {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: process.uptime(),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get test by ID' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'Test data retrieved successfully',
    type: TestResponseDto,
  })
  getTestById(@Param('id') id: string): TestResponseDto {
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

  @Post()
  @ApiOperation({ summary: 'Create test data' })
  @ApiBody({ type: TestRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Test data created successfully',
    type: TestResponseDto,
  })
  createTest(@Body() testData: TestRequestDto): TestResponseDto {
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
