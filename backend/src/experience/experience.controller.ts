import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';
import { Experience } from './experience.entity';

@ApiTags('Experiences')
@Controller('experiences')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Get()
  @ApiOperation({ summary: '경험 목록 조회 (최신순)' })
  async findAll() {
    const data = await this.experienceService.findAll();
    return { data: data.map((experience) => this.toExperienceResponse(experience)) };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '경험 생성 (관리자)' })
  async create(@Body() dto: CreateExperienceDto) {
    const data = await this.experienceService.create(dto);
    return { data: this.toExperienceResponse(data) };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '경험 수정 (관리자)' })
  @ApiParam({ name: 'id', description: '경험 ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateExperienceDto) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      throw new NotFoundException('잘못된 경험 ID');
    }
    const data = await this.experienceService.update(numericId, dto);
    return { data: this.toExperienceResponse(data) };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '경험 삭제 (관리자)' })
  @ApiParam({ name: 'id', description: '경험 ID' })
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      throw new NotFoundException('잘못된 경험 ID');
    }
    await this.experienceService.remove(numericId);
    return { message: '삭제되었습니다.' };
  }

  private toExperienceResponse(experience: Experience) {
    return {
      id: experience.id,
      type: experience.type,
      title: experience.title,
      organization: experience.organization,
      startDate: experience.startDate,
      endDate: experience.endDate,
      description: experience.description,
      linkedProjects: (experience.projects || []).map((project) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        category: project.category,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
      })),
    };
  }
}
