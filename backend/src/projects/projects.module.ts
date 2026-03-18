import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './project.entity';
import { Post } from '../posts/entity/post.entity';
import { Experience } from '../experience/experience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Post, Experience])],
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
