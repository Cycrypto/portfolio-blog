import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactNotificationService } from './contact-notification.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepository: Repository<ContactMessage>,
    private readonly contactNotificationService: ContactNotificationService,
  ) {}

  async create(data: CreateContactDto): Promise<ContactMessage> {
    const contact = await this.contactRepository.save(
      this.contactRepository.create(data),
    );

    try {
      await this.contactNotificationService.sendNewContactNotification(contact);
    } catch (error) {
      this.logger.warn(
        `Contact notification dispatch failed for contact ${contact.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    return contact;
  }

  async findAll(): Promise<ContactMessage[]> {
    return this.contactRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateRead(id: number, isRead = true): Promise<ContactMessage> {
    await this.contactRepository.update(id, { isRead });
    return this.contactRepository.findOneByOrFail({ id });
  }
}
