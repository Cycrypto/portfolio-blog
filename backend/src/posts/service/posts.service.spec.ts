jest.mock('isomorphic-dompurify', () => {
  const { JSDOM } = require('jsdom');
  const createDOMPurify = require('dompurify');

  const window = new JSDOM('<!DOCTYPE html><html><body></body></html>').window;
  const purify = createDOMPurify(window);

  return {
    __esModule: true,
    default: purify,
    sanitize: purify.sanitize.bind(purify),
    addHook: purify.addHook.bind(purify),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../comments/entity/comment.entity';
import { Post, PostContentType } from '../entity/post.entity';
import { TagsService } from './tags.service';
import { PostsService } from './posts.service';

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('PostsService', () => {
  let service: PostsService;
  let postRepository: MockRepository<Post>;
  let commentRepository: MockRepository<Comment>;

  beforeEach(async () => {
    postRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
    };

    commentRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepository,
        },
        {
          provide: TagsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('does not rewrite media-only posts when zero-value caches are already valid', async () => {
    const post = {
      id: 1,
      contentType: PostContentType.MARKDOWN,
      contentMarkdown: '![Hero](https://example.com/image.png)',
      contentJson: null,
      contentHtml: '<p><img src="https://example.com/image.png" alt="Hero"></p>',
      plainText: '',
      headings: [],
      wordCount: 0,
      readTime: 1,
      comments: 0,
    } as unknown as Post;

    postRepository.findOne!.mockResolvedValue(post);

    const result = await service.getPostById(1);

    expect(postRepository.save).not.toHaveBeenCalled();
    expect(commentRepository.count).toHaveBeenCalledWith({
      where: {
        postId: 1,
        isDeleted: false,
      },
    });
    expect(result?.plainText).toBe('');
    expect(result?.wordCount).toBe(0);
  });
});
