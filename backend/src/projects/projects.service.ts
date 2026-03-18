import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { normalizeUrlFieldsInPlace } from '../common/utils/url.util';
import { generateSlug } from '../common/utils/slug.util';
import { Post } from '../posts/entity/post.entity';
import { Experience } from '../experience/experience.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  private async resolveUniqueSlug(
    requestedSlug: string,
    excludeProjectId?: number,
    manager?: EntityManager,
  ): Promise<string> {
    const projectRepository = manager
      ? manager.getRepository(Project)
      : this.projectRepository;
    const baseSlug = requestedSlug || 'project';
    let candidate = baseSlug;
    let attempt = 2;

    while (true) {
      const existing = await projectRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing || existing.id === excludeProjectId) {
        return candidate;
      }

      candidate = `${baseSlug}-${attempt}`;
      attempt += 1;
    }
  }

  private sanitizeLinkedPostIds(linkedPostIds?: number[]): number[] {
    if (!linkedPostIds) {
      return [];
    }

    return [...new Set(linkedPostIds.filter((postId) => Number.isInteger(postId) && postId > 0))];
  }

  private async resolveExperienceId(
    experienceId: number | null | undefined,
    manager: EntityManager,
  ): Promise<number | null | undefined> {
    if (experienceId === undefined) {
      return undefined;
    }

    if (experienceId === null) {
      return null;
    }

    const experience = await manager.getRepository(Experience).findOne({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new BadRequestException('연결할 경험을 찾을 수 없습니다.');
    }

    return experience.id;
  }

  private async syncLinkedPosts(
    projectId: number,
    linkedPostIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    const postRepository = manager.getRepository(Post);
    const normalizedIds = this.sanitizeLinkedPostIds(linkedPostIds);

    if (normalizedIds.length === 0) {
      await postRepository
        .createQueryBuilder()
        .update(Post)
        .set({ projectId: null })
        .where(`"projectId" = :projectId`, { projectId })
        .execute();
      return;
    }

    const targetPosts = await postRepository.find({
      where: { id: In(normalizedIds) },
    });

    if (targetPosts.length !== normalizedIds.length) {
      throw new BadRequestException('연결할 블로그 글 일부를 찾을 수 없습니다.');
    }

    const conflictingPost = targetPosts.find(
      (post) => post.projectId && post.projectId !== projectId,
    );

    if (conflictingPost) {
      throw new ConflictException(
        `이미 다른 프로젝트에 연결된 글입니다: ${conflictingPost.title}`,
      );
    }

    await postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ projectId: null })
      .where(`"projectId" = :projectId`, { projectId })
      .andWhere(`"id" NOT IN (:...postIds)`, { postIds: normalizedIds })
      .execute();

    await postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ projectId })
      .where(`"id" IN (:...postIds)`, { postIds: normalizedIds })
      .execute();
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    normalizeUrlFieldsInPlace(createProjectDto, ['githubUrl', 'liveUrl']);
    return this.projectRepository.manager.transaction(async (manager) => {
      const { linkedPostIds, experienceId, ...projectPayload } = createProjectDto;
      const requestedSlug =
        projectPayload.slug?.trim() || generateSlug(projectPayload.title);
      const slug = await this.resolveUniqueSlug(requestedSlug, undefined, manager);
      const resolvedExperienceId = await this.resolveExperienceId(
        experienceId,
        manager,
      );
      const projectRepository = manager.getRepository(Project);
      const project = projectRepository.create({
        ...projectPayload,
        slug,
        isFeatured: projectPayload.isFeatured ?? false,
        featuredOrder: projectPayload.featuredOrder ?? 0,
        techStack: projectPayload.techStack || [],
        features: projectPayload.features || [],
        impactMetrics: projectPayload.impactMetrics || [],
        resumeHighlights: projectPayload.resumeHighlights || [],
        images: projectPayload.images || [],
        experienceId: resolvedExperienceId ?? null,
      });
      const savedProject = await projectRepository.save(project);

      if (linkedPostIds !== undefined) {
        await this.syncLinkedPosts(savedProject.id, linkedPostIds, manager);
      }

      return savedProject;
    });
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.projectRepository.find({
      relations: ['experience', 'posts'],
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

        project.posts =
          project.posts?.sort(
            (a, b) =>
              new Date(b.publishDate || 0).getTime() -
              new Date(a.publishDate || 0).getTime(),
          ) || [];

        shouldSave =
          normalizeUrlFieldsInPlace(project, ['githubUrl', 'liveUrl']) ||
          shouldSave;

        return shouldSave ? this.projectRepository.save(project) : project;
      }),
    );
  }

  async findOne(id: number): Promise<Project | null> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['experience'],
    });

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

  async findOneWithLinkedPosts(id: number): Promise<Project | null> {
    const basicProject = await this.findOne(id);
    if (!basicProject) {
      return null;
    }

    const detailedProject = await this.projectRepository.findOne({
      where: { id: basicProject.id },
      relations: ['posts', 'posts.tags', 'experience'],
    });

    if (!detailedProject) {
      return null;
    }

    detailedProject.posts =
      detailedProject.posts?.sort((a, b) =>
        new Date(b.publishDate || 0).getTime() -
        new Date(a.publishDate || 0).getTime(),
      ) || [];

    return detailedProject;
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
        relations: ['experience'],
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

  async findOneByIdentifierWithLinkedPosts(
    identifier: string,
  ): Promise<Project | null> {
    const basicProject = await this.findOneByIdentifier(identifier);
    if (!basicProject) {
      return null;
    }

    return this.findOneWithLinkedPosts(basicProject.id);
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project | null> {
    return this.projectRepository.manager.transaction(async (manager) => {
      const projectRepository = manager.getRepository(Project);
      const project = await projectRepository.findOne({ where: { id } });
      if (!project) {
        return null;
      }

      normalizeUrlFieldsInPlace(updateProjectDto, ['githubUrl', 'liveUrl']);
      const { linkedPostIds, experienceId, ...restProjectPayload } =
        updateProjectDto;
      const projectPayload: Partial<Project> = { ...restProjectPayload };

      if (
        projectPayload.slug !== undefined ||
        projectPayload.title !== undefined ||
        !project.slug
      ) {
        const requestedSlug =
          projectPayload.slug?.trim() ||
          generateSlug(projectPayload.title ?? project.title);
        projectPayload.slug = await this.resolveUniqueSlug(
          requestedSlug,
          project.id,
          manager,
        );
      }

      if ('experienceId' in updateProjectDto) {
        projectPayload.experienceId = await this.resolveExperienceId(
          experienceId,
          manager,
        );
      }

      const merged = projectRepository.merge(project, projectPayload);
      merged.impactMetrics =
        projectPayload.impactMetrics ?? merged.impactMetrics ?? [];
      merged.resumeHighlights =
        projectPayload.resumeHighlights ?? merged.resumeHighlights ?? [];

      const savedProject = await projectRepository.save(merged);

      if (linkedPostIds !== undefined) {
        await this.syncLinkedPosts(savedProject.id, linkedPostIds, manager);
      }

      return savedProject;
    });
  }

  async remove(id: number): Promise<boolean> {
    const project = await this.findOne(id);
    if (!project) return false;
    await this.projectRepository.remove(project);
    return true;
  }
}
