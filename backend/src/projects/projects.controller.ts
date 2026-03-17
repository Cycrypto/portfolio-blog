import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';
import { Project } from './project.entity';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '프로젝트 목록 조회' })
  async findAll() {
    const projects = await this.projectsService.findAll();
    return { data: projects.map((project) => this.toProjectResponse(project)) };
  }

  @Get(':id')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiParam({ name: 'id', description: '프로젝트 ID 또는 slug' })
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOneByIdentifierWithLinkedPosts(id);
    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }
    return { data: this.toProjectResponse(project) };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '프로젝트 생성 (관리자)' })
  async create(@Body() createProjectDto: CreateProjectDto) {
    const project = await this.projectsService.create(createProjectDto);
    return { data: this.toProjectResponse(project) };
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
    return { data: this.toProjectResponse(project) };
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

  private toProjectResponse(project: Project) {
    return {
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      longDescription: project.longDescription,
      category: project.category,
      status: project.status,
      isFeatured: project.isFeatured,
      featuredOrder: project.featuredOrder,
      progress: project.progress,
      techStack: project.techStack || [],
      features: project.features || [],
      role: project.role,
      problem: project.problem,
      approach: project.approach,
      outcomes: project.outcomes,
      impactMetrics: project.impactMetrics || [],
      resumeTitle: project.resumeTitle,
      resumeSummary: project.resumeSummary,
      resumeHighlights: project.resumeHighlights || [],
      startDate: project.startDate,
      endDate: project.endDate,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      images: project.images || [],
      linkedPosts: (project.posts || []).map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        publishDate: post.publishDate,
        readTime: post.readTime,
        status: post.status,
        tags: post.tags ? post.tags.map((tag) => tag.name) : [],
      })),
    };
  }
}
