import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import type { Contact } from '@prisma/client';

import type { ContactResponseDto } from '../dto/contact-response.dto';
import type { CreateContactDto } from '../dto/create-contact.dto';

import { EmailService } from '@/common/services/email.service';
import { PrismaService } from '@/common/services/prisma.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Creates a new contact form submission and sends notification email
   * @param createContactDto - The contact data
   * @returns Promise resolving to the created contact
   * @throws {InternalServerErrorException} When contact creation fails
   */
  async create(createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    try {
      this.logger.log(`Creating new contact from: ${createContactDto.email}`);

      // Save contact to database
      const contact: Contact = await this.prisma.contact.create({
        data: {
          name: createContactDto.name,
          email: createContactDto.email,
          message: createContactDto.message,
        },
      });

      this.logger.log(`Contact created successfully with ID: ${contact.id}`);

      // Send notification email to admin (don't wait for it)
      this.emailService
        .sendContactNotification(
          createContactDto.name,
          createContactDto.email,
          createContactDto.message
        )
        .then(success => {
          if (success) {
            this.logger.log(`Contact notification email sent for contact ID: ${contact.id}`);
          } else {
            this.logger.warn(
              `Failed to send contact notification email for contact ID: ${contact.id}`
            );
          }
        })
        .catch(error => {
          this.logger.error(
            `Error sending contact notification email for contact ID: ${contact.id}`,
            error
          );
        });

      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        createdAt: contact.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create contact', error);
      throw new InternalServerErrorException('Failed to submit contact form');
    }
  }
}
