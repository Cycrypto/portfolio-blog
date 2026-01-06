import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      techStack: createProjectDto.techStack || [],
      features: createProjectDto.features || [],
      images: createProjectDto.images || [],
    });
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async findOne(id: number): Promise<Project | null> {
    return this.projectRepository.findOne({ where: { id } });
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project | null> {
    const project = await this.findOne(id);
    if (!project) return null;

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
