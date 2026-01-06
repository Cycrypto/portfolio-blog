import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Post } from '../posts/entity/post.entity';
import { Project } from '../projects/project.entity';
import { Comment } from '../comments/entity/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Project, Comment])],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
