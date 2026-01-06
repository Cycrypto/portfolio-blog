import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entity/post.entity';
import { Project } from '../projects/project.entity';
import { Comment } from '../comments/entity/comment.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getTotals() {
    const [posts, projects, comments] = await Promise.all([
      this.postRepository.count(),
      this.projectRepository.count(),
      this.commentRepository.count({ where: { isDeleted: false } }),
    ]);

    return { posts, projects, comments };
  }

  async getRecentPosts(limit = 5) {
    return this.postRepository.find({
      order: { publishDate: 'DESC' },
      take: limit,
    });
  }

  async getRecentProjects(limit = 5) {
    return this.projectRepository.find({
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
