import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';

@ApiTags('Experiences')
@Controller('experiences')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Get()
  @ApiOperation({ summary: '경력 목록 조회 (최신순)' })
  async findAll() {
    const data = await this.experienceService.findAll();
    return { data };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '경력 생성 (관리자)' })
  async create(@Body() dto: CreateExperienceDto) {
    const data = await this.experienceService.create(dto);
    return { data };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '경력 수정 (관리자)' })
  @ApiParam({ name: 'id', description: '경력 ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateExperienceDto) {
    const data = await this.experienceService.update(parseInt(id, 10), dto);
    return { data };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '경력 삭제 (관리자)' })
  @ApiParam({ name: 'id', description: '경력 ID' })
  async remove(@Param('id') id: string) {
    await this.experienceService.remove(parseInt(id, 10));
    return { message: '삭제되었습니다.' };
  }
}
