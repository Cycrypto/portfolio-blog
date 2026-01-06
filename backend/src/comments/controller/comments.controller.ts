import {Body, Controller, Get, Param, Post, Patch, Delete, UseGuards} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import {CommentsService} from "../service/comments.service";
import {CreateCommnetRequestDto} from "../dto/request/create-commnet-request.dto";
import {UpdateCommentRequestDto} from "../dto/request/update-comment-request.dto";
import {Comment} from '../entity/comment.entity';
import {CommentResponseDto, CreateCommentResponseDto, GetCommentsResponseDto} from "../dto/response/comment-response.dto";
import { JwtRoleGuard } from "../../auth/common/jwt-role.guard";
import { Roles } from "../../auth/decorator/auth-role.decorator";


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
        @Param('postId') postId: string,
        @Body() dto: CreateCommnetRequestDto,
    ): Promise<CreateCommentResponseDto>{
        const comment = await this.commentsService.createComment(({...dto, postId}));
        return {success: true, data: this.mapToResponseDto(comment)};
    }

    @Get()
    @ApiOperation({ summary: '포스트 댓글 목록 조회', description: '특정 포스트의 댓글 목록을 조회합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiResponse({ status: 200, description: '성공', type: GetCommentsResponseDto })
    @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
    async getComments(
        @Param('postId') postId: string,
    ): Promise<GetCommentsResponseDto>{
        const comments = await this.commentsService.getCommentsByPost(postId);
        return {success: true, data: comments.map(comment => this.mapToResponseDto(comment))};
    }

    @Get('comment/:commentId')
    @ApiOperation({ summary: '특정 댓글 조회', description: '댓글 ID로 특정 댓글을 조회합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiParam({ name: 'commentId', description: '댓글 ID' })
    @ApiResponse({ status: 200, description: '성공', type: CreateCommentResponseDto })
    @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
    async getComment(
        @Param('commentId') commentId: string,
    ): Promise<CreateCommentResponseDto>{
        const comment = await this.commentsService.getCommentById(commentId);
        return {success: true, data: this.mapToResponseDto(comment)};
    }

    @Patch(':commentId')
    @ApiBearerAuth('JWT-auth')
    @UseGuards(JwtRoleGuard)
    @Roles('admin')
    @ApiOperation({ summary: '댓글 수정', description: '기존 댓글을 수정합니다. 인증이 필요합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiParam({ name: 'commentId', description: '수정할 댓글 ID' })
    @ApiBody({ type: UpdateCommentRequestDto })
    @ApiResponse({ status: 200, description: '댓글이 성공적으로 수정됨', type: CreateCommentResponseDto })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 403, description: '접근 권한이 없습니다.' })
    @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
    async update(
        @Param('commentId') commentId: string,
        @Body() dto: UpdateCommentRequestDto,
    ): Promise<CreateCommentResponseDto>{
        const comment = await this.commentsService.updateComment(commentId, dto);
        return {success: true, data: this.mapToResponseDto(comment)};
    }

    @Delete(':commentId')
    @ApiBearerAuth('JWT-auth')
    @UseGuards(JwtRoleGuard)
    @Roles('admin')
    @ApiOperation({ summary: '댓글 삭제', description: '댓글을 삭제합니다. 인증이 필요합니다.' })
    @ApiParam({ name: 'postId', description: '포스트 ID' })
    @ApiParam({ name: 'commentId', description: '삭제할 댓글 ID' })
    @ApiResponse({ status: 200, description: '댓글이 성공적으로 삭제됨' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 403, description: '접근 권한이 없습니다.' })
    @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
    async delete(
        @Param('commentId') commentId: string,
    ): Promise<{success: boolean; message: string}>{
        await this.commentsService.deleteComment(commentId);
        return {success: true, message: '댓글이 삭제되었습니다.'};
    }

    private mapToResponseDto(comment: Comment): CommentResponseDto {
        return {
            id: comment.id,
            postId: comment.postId,
            content: comment.content,
            authorName: comment.authorName,
            authorEmail: comment.authorEmail,
            parentId: comment.parentId,
            isDeleted: comment.isDeleted,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            replies: comment.replies?.map(reply => this.mapToResponseDto(reply))
        };
    }
}
