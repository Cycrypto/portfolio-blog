import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experience } from './experience.entity';
import { ExperienceService } from './experience.service';
import { ExperienceController } from './experience.controller';
import { Project } from '../projects/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Experience, Project])],
  providers: [ExperienceService],
  controllers: [ExperienceController],
})
export class ExperienceModule {}
