import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactMessage } from './contact.entity';
import { Profile } from '../profile/profile.entity';
import { ContactNotificationService } from './contact-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage, Profile])],
  controllers: [ContactController],
  providers: [ContactService, ContactNotificationService],
})
export class ContactModule {}
