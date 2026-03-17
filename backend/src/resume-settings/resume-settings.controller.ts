import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';
import { UpdateResumeSettingsDto } from './dto/update-resume-settings.dto';
import { ResumeSettingsService } from './resume-settings.service';

@ApiTags('ResumeSettings')
@Controller('resume-settings')
export class ResumeSettingsController {
  constructor(
    private readonly resumeSettingsService: ResumeSettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '이력서 설정 조회' })
  async getSettings() {
    const settings = await this.resumeSettingsService.getSettings();
    return { data: settings };
  }

  @Put()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '이력서 설정 수정 (Admin Only)' })
  async updateSettings(@Body() body: UpdateResumeSettingsDto) {
    const settings = await this.resumeSettingsService.updateSettings(body);
    return { data: settings };
  }
}
