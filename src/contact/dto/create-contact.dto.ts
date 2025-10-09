import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'Contact person name',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Contact person email address',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description: 'Contact message',
    example: 'I would like to know more about your services.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
