import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
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

@ApiTags('Idea Candidates')
@Controller('idea-candidates')
export class IdeaCandidatesController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
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
}
