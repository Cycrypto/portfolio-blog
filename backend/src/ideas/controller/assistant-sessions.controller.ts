import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtRoleGuard } from '../../auth/common/jwt-role.guard';
import { Roles } from '../../auth/decorator/auth-role.decorator';
import { IdeasService } from '../service/ideas.service';
import { SendAssistantMessageRequestDto } from '../dto/request/send-assistant-message-request.dto';
import { AssistantMessageResponseDto } from '../dto/response/assistant-message-response.dto';

@ApiTags('Assistant Sessions')
@Controller('assistant/sessions')
export class AssistantSessionsController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post(':id/messages')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '어시스턴트 세션에 메시지 전송 (Admin Only)' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiBody({ type: SendAssistantMessageRequestDto })
  @ApiResponse({
    status: 201,
    description: '어시스턴트 응답을 반환합니다.',
    type: AssistantMessageResponseDto,
  })
  async sendAssistantMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: SendAssistantMessageRequestDto,
  ): Promise<AssistantMessageResponseDto> {
    return this.ideasService.sendAssistantMessage(id, payload);
  }
}
