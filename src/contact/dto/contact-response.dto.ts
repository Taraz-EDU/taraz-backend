import { ApiProperty } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty({
    description: 'Contact ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Contact person name',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'Contact person email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Contact message',
    example: 'I would like to know more about your services.',
  })
  message!: string;

  @ApiProperty({
    description: 'Contact creation timestamp',
    example: '2024-10-09T09:59:51.000Z',
  })
  createdAt!: Date;
}
