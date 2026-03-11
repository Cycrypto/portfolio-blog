import { Body, Controller, Get, Param, Post, Patch, Delete, UseGuards, ParseIntPipe, BadRequestException, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

import { OptionalJwtAuthGuard } from "../../auth/common/optional-jwt-auth.guard";
import { Comment } from '../entity/comment.entity';
import { CommentsService } from "../service/comments.service";
import { CreateCommnetRequestDto } from "../dto/request/create-commnet-request.dto";
import { DeleteCommentRequestDto } from "../dto/request/delete-comment-request.dto";
import { UpdateCommentRequestDto } from "../dto/request/update-comment-request.dto";
import { CommentResponseDto, CreateCommentResponseDto, GetCommentsResponseDto } from "../dto/response/comment-response.dto";

@ApiTags('Comments')
@Controller('posts/:postId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post()
    @ApiOperation({ summary: '댓글 생성', description: '새로운 댓글을 생성합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiBody({ type: CreateCommnetRequestDto })
    @ApiResponse({ status: 201, description: '댓글이 성공적으로 생성됨', type: CreateCommentResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async create(
        @Param('postId', ParseIntPipe) postId: number,
        @Body() dto: CreateCommnetRequestDto,
    ): Promise<CreateCommentResponseDto> {
        if (dto.postId && dto.postId !== postId) {
            throw new BadRequestException('URL의 postId와 본문 postId가 일치하지 않습니다.');
        }

        const comment = await this.commentsService.createComment({ ...dto, postId });
        return { success: true, data: this.mapToResponseDto(comment) };
    }

    @Get()
    @ApiOperation({ summary: '포스트 댓글 목록 조회', description: '특정 포스트의 댓글 목록을 조회합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiResponse({ status: 200, description: '성공', type: GetCommentsResponseDto })
    @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
    async getComments(
        @Param('postId', ParseIntPipe) postId: number,
    ): Promise<GetCommentsResponseDto> {
        const comments = await this.commentsService.getCommentsByPost(postId);
        return { success: true, data: comments.map((comment) => this.mapToResponseDto(comment)) };
    }

    @Get('comment/:commentId')
    @ApiOperation({ summary: '특정 댓글 조회', description: '댓글 ID로 특정 댓글을 조회합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiParam({ name: 'commentId', description: '댓글 ID' })
    @ApiResponse({ status: 200, description: '성공', type: CreateCommentResponseDto })
    @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
    async getComment(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('commentId') commentId: string,
    ): Promise<CreateCommentResponseDto> {
        const comment = await this.commentsService.getCommentById(postId, commentId);
        return { success: true, data: this.mapToResponseDto(comment) };
    }

    @Patch(':commentId')
    @ApiOperation({ summary: '댓글 수정', description: '댓글 작성 시 설정한 비밀번호로 기존 댓글을 수정합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiParam({ name: 'commentId', description: '수정할 댓글 ID' })
    @ApiBody({ type: UpdateCommentRequestDto })
    @ApiResponse({ status: 200, description: '댓글이 성공적으로 수정됨', type: CreateCommentResponseDto })
    @ApiResponse({ status: 403, description: '비밀번호가 올바르지 않습니다.' })
    @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
    async update(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('commentId') commentId: string,
        @Body() dto: UpdateCommentRequestDto,
    ): Promise<CreateCommentResponseDto> {
        const comment = await this.commentsService.updateComment(postId, commentId, dto);
        return { success: true, data: this.mapToResponseDto(comment) };
    }

    @Delete(':commentId')
    @ApiBearerAuth('JWT-auth')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: '댓글 삭제', description: '관리자이거나 댓글 작성 비밀번호가 일치하면 댓글을 삭제합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiParam({ name: 'commentId', description: '삭제할 댓글 ID' })
    @ApiBody({ type: DeleteCommentRequestDto, required: false })
    @ApiResponse({ status: 200, description: '댓글이 성공적으로 삭제됨' })
    @ApiResponse({ status: 403, description: '비밀번호가 올바르지 않거나 삭제 권한이 없습니다.' })
    @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
    async delete(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('commentId') commentId: string,
        @Body() dto: DeleteCommentRequestDto,
        @Req() request: Request & { user?: { roles?: string[] } },
    ): Promise<{ success: boolean; message: string }> {
        await this.commentsService.deleteComment(postId, commentId, {
            password: dto?.password,
            roles: request.user?.roles,
        });

        return { success: true, message: '댓글이 삭제되었습니다.' };
    }

    private mapToResponseDto(comment: Comment): CommentResponseDto {
        return {
            id: comment.id,
            postId: comment.postId,
            content: comment.content,
            authorName: comment.authorName,
            parentId: comment.parentId,
            isDeleted: comment.isDeleted,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            replies: comment.replies?.map((reply) => this.mapToResponseDto(reply)),
        };
    }
}
