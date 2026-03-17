import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { normalizeUrlFieldsInPlace } from '../common/utils/url.util';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  private async resolveUniqueSlug(
    requestedSlug: string,
    excludeProjectId?: number,
  ): Promise<string> {
    const baseSlug = requestedSlug || 'project';
    let candidate = baseSlug;
    let attempt = 2;

    while (true) {
      const existing = await this.projectRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing || existing.id === excludeProjectId) {
        return candidate;
      }

      candidate = `${baseSlug}-${attempt}`;
      attempt += 1;
    }
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    normalizeUrlFieldsInPlace(createProjectDto, ['githubUrl', 'liveUrl']);
    const requestedSlug =
      createProjectDto.slug?.trim() || generateSlug(createProjectDto.title);
    const slug = await this.resolveUniqueSlug(requestedSlug);
    const project = this.projectRepository.create({
      ...createProjectDto,
      slug,
      isFeatured: createProjectDto.isFeatured ?? false,
      featuredOrder: createProjectDto.featuredOrder ?? 0,
      techStack: createProjectDto.techStack || [],
      features: createProjectDto.features || [],
      impactMetrics: createProjectDto.impactMetrics || [],
      images: createProjectDto.images || [],
    });
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.projectRepository.find({
      order: {
        isFeatured: 'DESC',
        featuredOrder: 'ASC',
        startDate: 'DESC',
        id: 'DESC',
      },
    });
    return Promise.all(
      projects.map(async (project) => {
        let shouldSave = false;
        if (!project.slug) {
          project.slug = generateSlug(project.title);
          shouldSave = true;
        }

        shouldSave =
          normalizeUrlFieldsInPlace(project, ['githubUrl', 'liveUrl']) ||
          shouldSave;

        return shouldSave ? this.projectRepository.save(project) : project;
      }),
    );
  }

  async findOne(id: number): Promise<Project | null> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      return null;
    }

    let shouldSave = false;
    if (!project.slug) {
      project.slug = generateSlug(project.title);
      shouldSave = true;
    }

    shouldSave =
      normalizeUrlFieldsInPlace(project, ['githubUrl', 'liveUrl']) ||
      shouldSave;

    return shouldSave ? this.projectRepository.save(project) : project;
  }

  async findOneByIdentifier(identifier: string): Promise<Project | null> {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      return null;
    }

    let project: Project | null = null;
    if (/^\d+$/.test(normalizedIdentifier)) {
      project = await this.findOne(Number.parseInt(normalizedIdentifier, 10));
    }

    if (!project) {
      project = await this.projectRepository.findOne({
        where: { slug: normalizedIdentifier },
      });
    }

    if (!project) {
      return null;
    }

    let shouldSave = false;
    if (!project.slug) {
      project.slug = generateSlug(project.title);
      shouldSave = true;
    }

    shouldSave =
      normalizeUrlFieldsInPlace(project, ['githubUrl', 'liveUrl']) ||
      shouldSave;

    return shouldSave ? this.projectRepository.save(project) : project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project | null> {
    const project = await this.findOne(id);
    if (!project) return null;

    normalizeUrlFieldsInPlace(updateProjectDto, ['githubUrl', 'liveUrl']);
    if (updateProjectDto.slug !== undefined || updateProjectDto.title !== undefined || !project.slug) {
      const requestedSlug =
        updateProjectDto.slug?.trim() ||
        generateSlug(updateProjectDto.title ?? project.title);
      updateProjectDto.slug = await this.resolveUniqueSlug(requestedSlug, project.id);
    }
    const merged = this.projectRepository.merge(project, updateProjectDto);
    merged.impactMetrics = updateProjectDto.impactMetrics ?? merged.impactMetrics ?? [];
    return this.projectRepository.save(merged);
  }

  async remove(id: number): Promise<boolean> {
    const project = await this.findOne(id);
    if (!project) return false;
    await this.projectRepository.remove(project);
    return true;
  }
}
