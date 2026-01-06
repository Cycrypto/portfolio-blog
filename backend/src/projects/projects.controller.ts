import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '프로젝트 목록 조회' })
  async findAll() {
    const projects = await this.projectsService.findAll();
    return { data: projects };
  }

  @Get(':id')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiParam({ name: 'id', description: '프로젝트 ID' })
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      throw new NotFoundException('잘못된 프로젝트 ID');
    }
    const project = await this.projectsService.findOne(numericId);
    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }
    return { data: project };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '프로젝트 생성 (관리자)' })
  async create(@Body() createProjectDto: CreateProjectDto) {
    const project = await this.projectsService.create(createProjectDto);
    return { data: project };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '프로젝트 수정 (관리자)' })
  @ApiParam({ name: 'id', description: '프로젝트 ID' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      throw new NotFoundException('잘못된 프로젝트 ID');
    }
    const project = await this.projectsService.update(numericId, updateProjectDto);
    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }
    return { data: project };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '프로젝트 삭제 (관리자)' })
  @ApiParam({ name: 'id', description: '프로젝트 ID' })
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      throw new NotFoundException('잘못된 프로젝트 ID');
    }
    const removed = await this.projectsService.remove(numericId);
    if (!removed) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }
    return { message: '삭제되었습니다.' };
  }
}
