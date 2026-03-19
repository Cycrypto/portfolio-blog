import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './controller/posts.controller';
import { PostsService } from './service/posts.service';
import { TagsController } from './controller/tags.controller';
import { TagsService } from './service/tags.service';
import { Comment } from '../comments/entity/comment.entity';
import { Post } from './entity/post.entity';
import { Tag } from './entity/tag.entity';
import { IdeaCandidate } from '../ideas/entity/idea-candidate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag, Comment, IdeaCandidate])],
  controllers: [PostsController, TagsController],
  providers: [PostsService, TagsService],
  exports: [PostsService, TagsService],
})
export class PostsModule {}
