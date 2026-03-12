import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entity/post.entity';
import { Project } from '../projects/project.entity';
import { Comment } from '../comments/entity/comment.entity';
import { PostsService } from '../posts/service/posts.service';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly postsService: PostsService,
  ) {}

  async getTotals() {
    const [posts, projects, comments, viewsResult] = await Promise.all([
      this.postRepository.count(),
      this.projectRepository.count(),
      this.commentRepository.count({ where: { isDeleted: false } }),
      this.postRepository
        .createQueryBuilder('post')
        .select('COALESCE(SUM(post.views), 0)', 'totalViews')
        .getRawOne<{ totalViews: string | null }>(),
    ]);

    return {
      posts,
      projects,
      comments,
      views: Number(viewsResult?.totalViews ?? 0),
    };
  }

  async getRecentPosts(limit = 5) {
    return this.postsService.getAdminPosts('', '', 1, limit);
  }

  async getRecentProjects(limit = 5) {
    return this.projectRepository.find({
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        progress: true,
        images: true,
      },
      order: { id: 'DESC' },
      take: limit,
    });
  }

  async getStats() {
    const [totals, recentPosts, recentProjects] = await Promise.all([
      this.getTotals(),
      this.getRecentPosts(),
      this.getRecentProjects(),
    ]);

    return { totals, recentPosts, recentProjects };
  }
}
