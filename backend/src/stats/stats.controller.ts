import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth-role.decorator';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '사이트 통계 조회' })
  async getStats() {
    const data = await this.statsService.getStats();
    return { data };
  }
}
