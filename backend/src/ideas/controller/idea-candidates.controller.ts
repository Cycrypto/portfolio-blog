import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtRoleGuard } from '../../auth/common/jwt-role.guard';
import { Roles } from '../../auth/decorator/auth-role.decorator';
import { IdeasService } from '../service/ideas.service';
import {
  IdeaCandidateStatus,
} from '../entity/idea-candidate.entity';
import { IdeaCandidateResponseDto } from '../dto/response/idea-candidate-response.dto';
import { AssistantSessionResponseDto } from '../dto/response/assistant-session-response.dto';
import { GenerateIdeaDraftRequestDto } from '../dto/request/generate-idea-draft-request.dto';
import { DraftGenerationResponseDto } from '../dto/response/draft-generation-response.dto';
import { DismissIdeaCandidatesResponseDto } from '../dto/response/dismiss-idea-candidates-response.dto';

@ApiTags('Idea Candidates')
@Controller()
export class IdeaCandidatesController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get('idea-candidates')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '글감 후보 목록 조회 (Admin Only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IdeaCandidateStatus,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '글감 후보 목록을 반환합니다.',
    type: [IdeaCandidateResponseDto],
  })
  async getIdeaCandidates(
    @Query('status') status: IdeaCandidateStatus = IdeaCandidateStatus.OPEN,
    @Query('limit') limit: number = 20,
  ): Promise<IdeaCandidateResponseDto[]> {
    return this.ideasService.getIdeaCandidates(status, limit);
  }

  @Delete('idea-candidates/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '글감 후보를 목록에서 제거합니다. (Admin Only)' })
  @ApiParam({ name: 'id', example: 12 })
  @ApiResponse({
    status: 200,
    description: '글감 후보가 dismissed 상태로 변경되었습니다.',
    type: IdeaCandidateResponseDto,
  })
  async dismissIdeaCandidate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IdeaCandidateResponseDto> {
    return this.ideasService.dismissIdeaCandidate(id);
  }

  @Delete('idea-candidates')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'open 상태 글감 후보를 전체 제거합니다. (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'open 상태 글감 후보를 dismissed 상태로 변경했습니다.',
    type: DismissIdeaCandidatesResponseDto,
  })
  async dismissAllIdeaCandidates(): Promise<DismissIdeaCandidatesResponseDto> {
    return this.ideasService.dismissAllIdeaCandidates();
  }

  @Post('ideas/:id/session')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '선택한 글감으로 어시스턴트 세션 시작 (Admin Only)' })
  @ApiParam({ name: 'id', example: 12 })
  @ApiResponse({
    status: 201,
    description: '어시스턴트 세션이 생성되었습니다.',
    type: AssistantSessionResponseDto,
  })
  async startAssistantSession(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AssistantSessionResponseDto> {
    return this.ideasService.startAssistantSession(id);
  }

  @Post('ideas/:id/draft')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '선택한 글감으로 초안 생성 (Admin Only)' })
  @ApiParam({ name: 'id', example: 12 })
  @ApiBody({ type: GenerateIdeaDraftRequestDto })
  @ApiResponse({
    status: 201,
    description: '초안 생성 결과를 반환합니다.',
    type: DraftGenerationResponseDto,
  })
  async generateIdeaDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: GenerateIdeaDraftRequestDto,
  ): Promise<DraftGenerationResponseDto> {
    return this.ideasService.generateIdeaDraft(id, payload);
  }
}
