import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './controller/posts.controller';
import { PostsService } from './service/posts.service';
import { TagsController } from './controller/tags.controller';
import { TagsService } from './service/tags.service';
import { Post } from './entity/post.entity';
import { Tag } from './entity/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag])],
  controllers: [PostsController, TagsController],
  providers: [PostsService, TagsService],
  exports: [PostsService, TagsService],
})
export class PostsModule {} 