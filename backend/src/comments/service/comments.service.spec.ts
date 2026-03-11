import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { compare, hash } from "bcrypt";
import { Repository } from "typeorm";
import { Post } from "../../posts/entity/post.entity";
import { Comment } from "../entity/comment.entity";
import { CommentsService } from "./comments.service";

type MockRepository<T extends object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function createQueryBuilderResult(comment: Comment | null) {
  return {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(comment),
  };
}

describe("CommentsService", () => {
  let service: CommentsService;
  let commentRepository: MockRepository<Comment>;
  let postRepository: MockRepository<Post>;

  beforeEach(async () => {
    commentRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    postRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it("stores a bcrypt hash instead of the raw password when creating a comment", async () => {
    postRepository.findOne!.mockResolvedValue({ id: 1 });

    const created = await service.createComment({
      postId: 1,
      content: "첫 댓글",
      authorName: "작성자",
      password: "secret-1234",
    });

    expect(commentRepository.create).toHaveBeenCalledTimes(1);
    expect(created.authorEmail).not.toBe("secret-1234");
    await expect(compare("secret-1234", created.authorEmail)).resolves.toBe(true);
  });

  it("updates a legacy email-based comment and upgrades the stored credential to a hash", async () => {
    const legacyComment = {
      id: "comment-1",
      postId: 1,
      content: "old",
      authorName: "작성자",
      authorEmail: "legacy@example.com",
      isDeleted: false,
    } as Comment;

    commentRepository.createQueryBuilder!.mockReturnValue(createQueryBuilderResult(legacyComment));

    const updated = await service.updateComment(1, "comment-1", {
      content: "updated",
      password: "legacy@example.com",
    });

    expect(updated.content).toBe("updated");
    expect(updated.authorEmail).not.toBe("legacy@example.com");
    await expect(compare("legacy@example.com", updated.authorEmail)).resolves.toBe(true);
  });

  it("treats legacy credentials starting with $2 as plain text unless they match a full bcrypt hash", async () => {
    const legacyComment = {
      id: "comment-legacy-prefix",
      postId: 1,
      content: "old",
      authorName: "작성자",
      authorEmail: "$2legacy@example.com",
      isDeleted: false,
    } as Comment;

    commentRepository.createQueryBuilder!.mockReturnValue(createQueryBuilderResult(legacyComment));

    const updated = await service.updateComment(1, "comment-legacy-prefix", {
      content: "updated",
      password: "$2legacy@example.com",
    });

    expect(updated.content).toBe("updated");
    expect(updated.authorEmail).not.toBe("$2legacy@example.com");
    await expect(compare("$2legacy@example.com", updated.authorEmail)).resolves.toBe(true);
  });

  it("rejects updates when the supplied password does not match", async () => {
    const storedHash = await hash("secret-1234", 10);
    const securedComment = {
      id: "comment-2",
      postId: 1,
      content: "old",
      authorName: "작성자",
      authorEmail: storedHash,
      isDeleted: false,
    } as Comment;

    commentRepository.createQueryBuilder!.mockReturnValue(createQueryBuilderResult(securedComment));

    await expect(
      service.updateComment(1, "comment-2", {
        content: "updated",
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
