import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { compare, hash } from "bcrypt";
import { Repository } from "typeorm";

import { Post } from "../../posts/entity/post.entity";
import { CreateCommnetRequestDto } from "../dto/request/create-commnet-request.dto";
import { UpdateCommentRequestDto } from "../dto/request/update-comment-request.dto";
import { Comment } from "../entity/comment.entity";

interface DeleteCommentActor {
    password?: string;
    roles?: string[];
}

@Injectable()
export class CommentsService {
    private static readonly BCRYPT_HASH_PATTERN = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
    ) {}

    async createComment(dto: CreateCommnetRequestDto & { postId: number }): Promise<Comment> {
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
                throw new NotFoundException('삭제된 댓글에는 답글을 작성할 수 없습니다.');
            }
        }

        const { password, ...commentData } = dto;
        const comment = this.commentRepository.create({
            ...commentData,
            authorEmail: await hash(password, 10),
        });

        return await this.commentRepository.save(comment)
    }

    async getCommentsByPost(postId: number): Promise<Comment[]> {
        const allComments = await this.commentRepository.find({
            where: { postId, isDeleted: false },
            order: { createdAt: 'ASC' },
        });

        const topLevelComments = allComments.filter((comment) => !comment.parentId);

        for (const comment of topLevelComments) {
            comment.replies = await this.buildReplyTreeFromList(comment.id, allComments);
        }

        return topLevelComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    private async buildReplyTreeFromList(parentId: string, allComments: Comment[]): Promise<Comment[]> {
        const replies = allComments.filter((comment) => comment.parentId === parentId);

        for (const reply of replies) {
            reply.replies = await this.buildReplyTreeFromList(reply.id, allComments);
        }

        return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
        comment.replies = await this.buildReplyTreeFromList(comment.id, allComments);

        return comment;
    }

    async updateComment(postId: number, commentId: string, dto: UpdateCommentRequestDto): Promise<Comment> {
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
                throw new NotFoundException('삭제된 댓글에는 답글을 작성할 수 없습니다.');
            }
        }

        comment.content = dto.content;

        if (!this.isHashedCredential(comment.authorEmail)) {
            comment.authorEmail = await hash(dto.password, 10);
        }

        return await this.commentRepository.save(comment);
    }

    async deleteComment(postId: number, commentId: string, actor: DeleteCommentActor = {}): Promise<void> {
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
    }

    private async deleteCommentRecursively(postId: number, commentId: string): Promise<void> {
        await this.commentRepository.update(commentId, { isDeleted: true });

        const replies = await this.commentRepository.find({
            where: { parentId: commentId, postId, isDeleted: false },
        });

        for (const reply of replies) {
            await this.deleteCommentRecursively(postId, reply.id);
        }
    }

    private async verifyCommentPassword(comment: Comment, password: string): Promise<void> {
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
