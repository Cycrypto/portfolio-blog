import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { normalizeUrlFieldsInPlace } from '../common/utils/url.util';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    normalizeUrlFieldsInPlace(createProjectDto, ['githubUrl', 'liveUrl']);
    const project = this.projectRepository.create({
      ...createProjectDto,
      techStack: createProjectDto.techStack || [],
      features: createProjectDto.features || [],
      images: createProjectDto.images || [],
    });
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.projectRepository.find();
    return Promise.all(
      projects.map(async (project) => {
        if (normalizeUrlFieldsInPlace(project, ['githubUrl', 'liveUrl'])) {
          return this.projectRepository.save(project);
        }

        return project;
      }),
    );
  }

  async findOne(id: number): Promise<Project | null> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      return null;
    }

    if (normalizeUrlFieldsInPlace(project, ['githubUrl', 'liveUrl'])) {
      return this.projectRepository.save(project);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project | null> {
    const project = await this.findOne(id);
    if (!project) return null;

    normalizeUrlFieldsInPlace(updateProjectDto, ['githubUrl', 'liveUrl']);
    const merged = this.projectRepository.merge(project, updateProjectDto);
    return this.projectRepository.save(merged);
  }

  async remove(id: number): Promise<boolean> {
    const project = await this.findOne(id);
    if (!project) return false;
    await this.projectRepository.remove(project);
    return true;
  }
}
