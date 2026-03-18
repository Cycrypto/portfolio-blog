import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';

import { Post } from '../../posts/entity/post.entity';
import { CreateCommnetRequestDto } from '../dto/request/create-commnet-request.dto';
import { UpdateCommentRequestDto } from '../dto/request/update-comment-request.dto';
import { Comment } from '../entity/comment.entity';

interface DeleteCommentActor {
  password?: string;
  roles?: string[];
}

export interface AdminCommentListItem {
  id: string;
  postId: number;
  postTitle: string;
  postSlug?: string | null;
  content: string;
  authorName: string;
  parentId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type AdminPostMetadata = Pick<Post, 'id' | 'title' | 'slug'>;

@Injectable()
export class CommentsService {
  private static readonly BCRYPT_HASH_PATTERN =
    /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async createComment(
    dto: CreateCommnetRequestDto & { postId: number },
  ): Promise<Comment> {
    const post = await this.postRepository.findOne({
      where: { id: dto.postId },
      select: ['id'],
    });

    if (!post) {
      throw new NotFoundException('포스트를 찾을 수 없습니다.');
    }

    if (dto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentId, postId: dto.postId },
      });

      if (!parentComment) {
        throw new NotFoundException('상위 댓글을 찾을 수 없습니다.');
      }

      if (parentComment.isDeleted) {
        throw new NotFoundException(
          '삭제된 댓글에는 답글을 작성할 수 없습니다.',
        );
      }
    }

    const { password, ...commentData } = dto;
    const comment = this.commentRepository.create({
      ...commentData,
      authorEmail: await hash(password, 10),
    });

    const savedComment = await this.commentRepository.save(comment);
    await this.syncPostCommentCount(dto.postId);

    return savedComment;
  }

  async getCommentsByPost(postId: number): Promise<Comment[]> {
    const allComments = await this.commentRepository.find({
      where: { postId, isDeleted: false },
      order: { createdAt: 'ASC' },
    });

    const topLevelComments = allComments.filter((comment) => !comment.parentId);

    for (const comment of topLevelComments) {
      comment.replies = await this.buildReplyTreeFromList(
        comment.id,
        allComments,
      );
    }

    return topLevelComments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getAdminComments(postId?: number): Promise<AdminCommentListItem[]> {
    const comments = await this.commentRepository.find({
      where: postId !== undefined ? { postId } : undefined,
      order: { createdAt: 'DESC' },
    });

    const postIds = Array.from(
      new Set(
        comments
          .map((comment) => Number(comment.postId))
          .filter((commentPostId) => Number.isInteger(commentPostId)),
      ),
    );
    const posts = await this.getAdminPostMetadata(postIds);
    const postsById = new Map(posts.map((post) => [post.id, post]));

    return comments.map((comment) => ({
      id: comment.id,
      postId: Number(comment.postId),
      postTitle:
        postsById.get(Number(comment.postId))?.title ??
        `포스트 #${comment.postId}`,
      postSlug: postsById.get(Number(comment.postId))?.slug ?? null,
      content: comment.content,
      authorName: comment.authorName,
      parentId: comment.parentId,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));
  }

  private async getAdminPostMetadata(
    postIds: number[],
  ): Promise<AdminPostMetadata[]> {
    if (postIds.length === 0) {
      return [];
    }

    return this.postRepository
      .createQueryBuilder('post')
      .select(['post.id', 'post.title', 'post.slug'])
      .where('post.id IN (:...postIds)', { postIds })
      .getMany();
  }

  private async buildReplyTreeFromList(
    parentId: string,
    allComments: Comment[],
  ): Promise<Comment[]> {
    const replies = allComments.filter(
      (comment) => comment.parentId === parentId,
    );

    for (const reply of replies) {
      reply.replies = await this.buildReplyTreeFromList(reply.id, allComments);
    }

    return replies.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async getCommentById(postId: number, commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, postId, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    const allComments = await this.commentRepository.find({
      where: { postId: comment.postId, isDeleted: false },
    });
    comment.replies = await this.buildReplyTreeFromList(
      comment.id,
      allComments,
    );

    return comment;
  }

  async updateComment(
    postId: number,
    commentId: string,
    dto: UpdateCommentRequestDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .addSelect('comment.authorEmail')
      .where('comment.id = :commentId', { commentId })
      .andWhere('comment.postId = :postId', { postId })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    await this.verifyCommentPassword(comment, dto.password);

    if (comment.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: comment.parentId, postId },
      });

      if (parentComment && parentComment.isDeleted) {
        throw new NotFoundException(
          '삭제된 댓글에는 답글을 작성할 수 없습니다.',
        );
      }
    }

    comment.content = dto.content;

    if (!this.isHashedCredential(comment.authorEmail)) {
      comment.authorEmail = await hash(dto.password, 10);
    }

    return await this.commentRepository.save(comment);
  }

  async deleteComment(
    postId: number,
    commentId: string,
    actor: DeleteCommentActor = {},
  ): Promise<void> {
    const isAdmin = actor.roles?.includes('admin') ?? false;
    const comment = isAdmin
      ? await this.commentRepository.findOne({
          where: { id: commentId, postId },
        })
      : await this.commentRepository
          .createQueryBuilder('comment')
          .addSelect('comment.authorEmail')
          .where('comment.id = :commentId', { commentId })
          .andWhere('comment.postId = :postId', { postId })
          .getOne();

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.isDeleted) {
      return;
    }

    if (!isAdmin) {
      if (!actor.password?.trim()) {
        throw new ForbiddenException('댓글 비밀번호가 일치하지 않습니다.');
      }

      await this.verifyCommentPassword(comment, actor.password);
    }

    await this.deleteCommentRecursively(postId, commentId);
    await this.syncPostCommentCount(postId);
  }

  private async deleteCommentRecursively(
    postId: number,
    commentId: string,
  ): Promise<void> {
    await this.commentRepository.update(commentId, { isDeleted: true });

    const replies = await this.commentRepository.find({
      where: { parentId: commentId, postId, isDeleted: false },
    });

    for (const reply of replies) {
      await this.deleteCommentRecursively(postId, reply.id);
    }
  }

  private async syncPostCommentCount(postId: number): Promise<void> {
    const activeCommentCount = await this.commentRepository.count({
      where: {
        postId,
        isDeleted: false,
      },
    });

    await this.postRepository.update(postId, { comments: activeCommentCount });
  }

  private async verifyCommentPassword(
    comment: Comment,
    password: string,
  ): Promise<void> {
    const isPasswordValid = this.isHashedCredential(comment.authorEmail)
      ? await compare(password, comment.authorEmail)
      : Boolean(comment.authorEmail && comment.authorEmail === password);

    if (!isPasswordValid) {
      throw new ForbiddenException('댓글 비밀번호가 일치하지 않습니다.');
    }
  }

  private isHashedCredential(value: string): boolean {
    return CommentsService.BCRYPT_HASH_PATTERN.test(value);
  }
}
