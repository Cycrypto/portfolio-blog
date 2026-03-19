import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtRoleGuard } from '../../auth/common/jwt-role.guard';
import { Roles } from '../../auth/decorator/auth-role.decorator';
import { IdeasService } from '../service/ideas.service';
import { ImportChatGptIdeaRequestDto } from '../dto/request/import-chatgpt-idea-request.dto';
import { AiImportChatGptResponseDto } from '../dto/response/ai-import-chatgpt-response.dto';
import { AiStatusResponseDto } from '../dto/response/ai-status-response.dto';

@ApiTags('AI Imports')
@Controller()
export class AiImportsController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get('ai/status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'AI worker 상태 조회 (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'AI worker와 fallback 상태를 반환합니다.',
    type: AiStatusResponseDto,
  })
  async getAiStatus(): Promise<AiStatusResponseDto> {
    return this.ideasService.getAiStatus();
  }

  @Post('ai-imports/chatgpt')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'ChatGPT 대화를 AI worker/fallback으로 가져오기 (Admin Only)' })
  @ApiBody({ type: ImportChatGptIdeaRequestDto })
  @ApiResponse({
    status: 201,
    description: '글감 후보와 생성 모드를 반환합니다.',
    type: AiImportChatGptResponseDto,
  })
  async importChatGptConversationWithAi(
    @Body() payload: ImportChatGptIdeaRequestDto,
    @Request() req,
  ): Promise<AiImportChatGptResponseDto> {
    return this.ideasService.importChatGptConversationWithAI(
      payload,
      req.user.userId,
    );
  }
}
