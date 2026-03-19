import {
  Body,
  Controller,
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
import { ImportChatGptIdeaResponseDto } from '../dto/response/import-chatgpt-idea-response.dto';

@ApiTags('Idea Imports')
@Controller('idea-imports')
export class IdeaImportsController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post('chatgpt')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'ChatGPT 대화에서 글감 후보 가져오기 (Admin Only)' })
  @ApiBody({ type: ImportChatGptIdeaRequestDto })
  @ApiResponse({
    status: 201,
    description: '글감 후보를 성공적으로 생성했습니다.',
    type: ImportChatGptIdeaResponseDto,
  })
  async importChatGptConversation(
    @Body() payload: ImportChatGptIdeaRequestDto,
    @Request() req,
  ): Promise<ImportChatGptIdeaResponseDto> {
    return this.ideasService.importChatGptConversation(payload, req.user.userId);
  }
}
