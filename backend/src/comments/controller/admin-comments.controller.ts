import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtRoleGuard } from '../../auth/common/jwt-role.guard';
import { Roles } from '../../auth/decorator/auth-role.decorator';
import { GetAdminCommentsResponseDto } from '../dto/response/comment-response.dto';
import { CommentsService } from '../service/comments.service';

@ApiTags('Comments')
@Controller('comments')
export class AdminCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('admin/list')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '관리자 댓글 목록 조회 (Admin Only)' })
  @ApiQuery({
    name: 'postId',
    required: false,
    description: '특정 포스트 ID로 댓글을 필터링합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '성공',
    type: GetAdminCommentsResponseDto,
  })
  async getAdminComments(
    @Query('postId') postId?: string,
  ): Promise<GetAdminCommentsResponseDto> {
    const trimmedPostId = postId?.trim();
    let parsedPostId: number | undefined;

    if (trimmedPostId) {
      parsedPostId = Number(trimmedPostId);
      if (!Number.isInteger(parsedPostId)) {
        throw new BadRequestException('유효한 postId가 필요합니다.');
      }
    }

    const comments = await this.commentsService.getAdminComments(parsedPostId);
    return { data: comments };
  }
}
