import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { ContactResponseDto } from '../dto/contact-response.dto';
import { CreateContactDto } from '../dto/create-contact.dto';
import { ContactService } from '../services/contact.service';

import { Public } from '@/auth/decorators/public.decorator';

@ApiTags('Contact')
@Controller('api/v1/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit contact form',
    description: 'Creates a new contact form submission and sends notification email to admin',
  })
  @ApiResponse({
    status: 201,
    description: 'Contact form submitted successfully',
    type: CreateContactDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async create(@Body() createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    return this.contactService.create(createContactDto);
  }
}
