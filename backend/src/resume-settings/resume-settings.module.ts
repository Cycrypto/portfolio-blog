import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Profile } from '../profile/profile.entity';
import { Project } from '../projects/project.entity';
import { ResumeSettingsController } from './resume-settings.controller';
import { ResumeSettings } from './resume-settings.entity';
import { ResumeSettingsService } from './resume-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([ResumeSettings, Profile, Project])],
  providers: [ResumeSettingsService],
  controllers: [ResumeSettingsController],
  exports: [ResumeSettingsService],
})
export class ResumeSettingsModule {}
