import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository, IsNull} from "typeorm";
import {CreateCommnetRequestDto} from "../dto/request/create-commnet-request.dto";
import {UpdateCommentRequestDto} from "../dto/request/update-comment-request.dto";
import {Comment} from '../entity/comment.entity'


@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) {}

    async createComment(dto: CreateCommnetRequestDto): Promise<Comment>{
        // 답글인 경우 상위 댓글이 삭제되지 않았는지 확인
        if (dto.parentId) {
            const parentComment = await this.commentRepository.findOne({
                where: { id: dto.parentId }
            });
            
            if (!parentComment) {
                throw new NotFoundException('상위 댓글을 찾을 수 없습니다.');
            }
            
            if (parentComment.isDeleted) {
                throw new NotFoundException('삭제된 댓글에는 답글을 작성할 수 없습니다.');
            }
        }

        const comment = this.commentRepository.create(dto);
        return await this.commentRepository.save(comment)
    }

    async getCommentsByPost(postId: string): Promise<Comment[]>{
        // 모든 댓글을 한 번에 조회
        const allComments = await this.commentRepository.find({
            where: {postId, isDeleted: false},
            order: {createdAt: 'ASC'}
        });

        // 최상위 댓글만 필터링
        const topLevelComments = allComments.filter(comment => !comment.parentId);
        
        // 각 최상위 댓글에 대해 답글 트리를 재귀적으로 구성
        for (const comment of topLevelComments) {
            comment.replies = await this.buildReplyTreeFromList(comment.id, allComments);
        }

        // 최상위 댓글을 생성 시간 역순으로 정렬
        return topLevelComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    private async buildReplyTreeFromList(parentId: string, allComments: Comment[]): Promise<Comment[]> {
        // 주어진 parentId를 가진 댓글들을 찾아서 트리 구성
        const replies = allComments.filter(comment => comment.parentId === parentId);
        
        for (const reply of replies) {
            reply.replies = await this.buildReplyTreeFromList(reply.id, allComments);
        }

        return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }



    async getCommentById(commentId: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, isDeleted: false }
        });

        if (!comment) {
            throw new NotFoundException('댓글을 찾을 수 없습니다.');
        }

        // 답글 트리 구성 (해당 댓글의 postId를 사용하여 전체 댓글에서 찾기)
        const allComments = await this.commentRepository.find({
            where: { postId: comment.postId, isDeleted: false }
        });
        comment.replies = await this.buildReplyTreeFromList(comment.id, allComments);

        return comment;
    }

    async updateComment(commentId: string, dto: UpdateCommentRequestDto): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, isDeleted: false }
        });

        if (!comment) {
            throw new NotFoundException('댓글을 찾을 수 없습니다.');
        }

        // 상위 댓글이 삭제되었는지 확인
        if (comment.parentId) {
            const parentComment = await this.commentRepository.findOne({
                where: { id: comment.parentId }
            });
            
            if (parentComment && parentComment.isDeleted) {
                throw new NotFoundException('삭제된 댓글에는 답글을 작성할 수 없습니다.');
            }
        }

        comment.content = dto.content;
        return await this.commentRepository.save(comment);
    }

    async deleteComment(commentId: string): Promise<void> {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            throw new NotFoundException('댓글을 찾을 수 없습니다.');
        }

        if (comment.isDeleted) {
            // 이미 삭제된 댓글인 경우 성공으로 처리
            return;
        }

        // 댓글과 모든 하위 답글들을 재귀적으로 삭제
        await this.deleteCommentRecursively(commentId);
    }

    private async deleteCommentRecursively(commentId: string): Promise<void> {
        // 현재 댓글 삭제
        await this.commentRepository.update(commentId, { isDeleted: true });

        // 하위 답글들 조회
        const replies = await this.commentRepository.find({
            where: { parentId: commentId, isDeleted: false }
        });

        // 각 하위 답글에 대해 재귀적으로 삭제 실행
        for (const reply of replies) {
            await this.deleteCommentRecursively(reply.id);
        }
    }
}