import { InternalServerErrorException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import type { CreateContactDto } from '../dto/create-contact.dto';

import { ContactService } from './contact.service';

import { EmailService } from '@/common/services/email.service';
import { PrismaService } from '@/common/services/prisma.service';

describe('ContactService', () => {
  let service: ContactService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: PrismaService,
          useValue: {
            contact: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendContactNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a contact and send notification email', async () => {
      // Arrange
      const createContactDto: CreateContactDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'I would like to know more about your services.',
      };

      const mockContact = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: createContactDto.name,
        email: createContactDto.email,
        message: createContactDto.message,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.contact, 'create').mockResolvedValue(mockContact);
      jest.spyOn(emailService, 'sendContactNotification').mockResolvedValue(true);

      // Act
      const result = await service.create(createContactDto);

      // Assert
      expect(result).toEqual({
        id: mockContact.id,
        name: mockContact.name,
        email: mockContact.email,
        message: mockContact.message,
        createdAt: mockContact.createdAt,
      });
      expect(prismaService.contact.create).toHaveBeenCalledWith({
        data: {
          name: createContactDto.name,
          email: createContactDto.email,
          message: createContactDto.message,
        },
      });
    });

    it('should throw InternalServerErrorException when database operation fails', async () => {
      // Arrange
      const createContactDto: CreateContactDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'I would like to know more about your services.',
      };

      jest.spyOn(prismaService.contact, 'create').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createContactDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.create(createContactDto)).rejects.toThrow(
        'Failed to submit contact form'
      );
    });
  });
});
