import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactRepository: Repository<ContactMessage>,
  ) {}

  async create(data: CreateContactDto): Promise<ContactMessage> {
    const contact = this.contactRepository.create(data);
    return this.contactRepository.save(contact);
  }

  async findAll(): Promise<ContactMessage[]> {
    return this.contactRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateRead(id: number, isRead = true): Promise<ContactMessage> {
    await this.contactRepository.update(id, { isRead });
    return this.contactRepository.findOneByOrFail({ id });
  }
}
