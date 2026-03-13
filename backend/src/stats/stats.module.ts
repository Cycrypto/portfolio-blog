import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Post } from '../posts/entity/post.entity';
import { Project } from '../projects/project.entity';
import { Comment } from '../comments/entity/comment.entity';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Project, Comment]), PostsModule],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
