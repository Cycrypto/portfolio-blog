import type { Repository } from 'typeorm';
import type { PostsService } from '../posts/service/posts.service';
import { Comment } from '../comments/entity/comment.entity';
import { Post } from '../posts/entity/post.entity';
import { Project } from '../projects/project.entity';
import { StatsService } from './stats.service';

jest.mock('../posts/service/posts.service', () => ({
  PostsService: class PostsService {},
}));

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

function createCountQueryBuilder(result: { totalComments: string | null }) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(result),
  };
}

function createViewsQueryBuilder(result: { totalViews: string | null }) {
  return {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(result),
  };
}

describe('StatsService', () => {
  let service: StatsService;
  let postRepository: MockRepository<Post>;
  let projectRepository: MockRepository<Project>;
  let commentRepository: MockRepository<Comment>;
  let postsService: Pick<PostsService, 'getAdminPosts'>;

  beforeEach(() => {
    postRepository = {
      count: jest.fn().mockResolvedValue(4),
      createQueryBuilder: jest.fn(),
    };
    projectRepository = {
      count: jest.fn().mockResolvedValue(2),
    };
    commentRepository = {
      createQueryBuilder: jest.fn(),
    };
    postsService = {
      getAdminPosts: jest.fn().mockResolvedValue([]),
    };

    service = new StatsService(
      postRepository as unknown as Repository<Post>,
      projectRepository as unknown as Repository<Project>,
      commentRepository as unknown as Repository<Comment>,
      postsService as PostsService,
    );
  });

  it('counts only active comments that are attached to an existing post', async () => {
    const commentQueryBuilder = createCountQueryBuilder({
      totalComments: '1',
    });
    const postViewsQueryBuilder = createViewsQueryBuilder({
      totalViews: '120',
    });

    commentRepository.createQueryBuilder!.mockReturnValue(commentQueryBuilder);
    postRepository.createQueryBuilder!.mockReturnValue(postViewsQueryBuilder);

    const totals = await service.getTotals();

    expect(commentRepository.createQueryBuilder).toHaveBeenCalledWith(
      'comment',
    );
    expect(commentQueryBuilder.innerJoin).toHaveBeenCalledWith(
      'comment.post',
      'post',
    );
    expect(commentQueryBuilder.where).toHaveBeenCalledWith(
      'comment.isDeleted = :isDeleted',
      { isDeleted: false },
    );
    expect(totals).toEqual({
      posts: 4,
      projects: 2,
      comments: 1,
      views: 120,
    });
  });
});
