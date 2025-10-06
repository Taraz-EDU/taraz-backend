import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'First name must be between 2 and 100 characters' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Last name must be between 2 and 100 characters' })
  lastName?: string;
}
