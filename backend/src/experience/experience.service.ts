import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Experience } from './experience.entity';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { Project } from '../projects/project.entity';
import {
  extractExperienceHighlights,
  normalizeResumeStringArray,
} from '../common/utils/resume-content.util';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
  ) {}

  async create(dto: CreateExperienceDto): Promise<Experience> {
    return this.experienceRepository.manager.transaction(async (manager) => {
      const experienceRepository = manager.getRepository(Experience);
      const payload = this.normalizePayload(dto);
      if (!payload.resumeHighlights?.length && payload.description) {
        payload.resumeHighlights = extractExperienceHighlights(
          [payload.description],
          2,
        );
      }

      const exp = experienceRepository.create(payload);
      const saved = await experienceRepository.save(exp);

      if (dto.linkedProjectIds !== undefined) {
        await this.syncLinkedProjects(saved.id, dto.linkedProjectIds, manager);
      }

      return (await this.findOneWithLinkedProjects(saved.id, manager)) ?? saved;
    });
  }

  async findAll(): Promise<Experience[]> {
    const experiences = await this.experienceRepository
      .createQueryBuilder('experience')
      .leftJoinAndSelect('experience.projects', 'project')
      .orderBy(
        `CASE WHEN COALESCE(NULLIF("experience"."endDate", ''), '') = '' THEN 0 ELSE 1 END`,
        'ASC',
      )
      .addOrderBy(
        `COALESCE(NULLIF("experience"."endDate", ''), "experience"."startDate")`,
        'DESC',
      )
      .addOrderBy(`"experience"."startDate"`, 'DESC')
      .addOrderBy(`"experience"."id"`, 'DESC')
      .addOrderBy(`"project"."isFeatured"`, 'DESC')
      .addOrderBy(`"project"."featuredOrder"`, 'ASC')
      .addOrderBy(
        `COALESCE(NULLIF("project"."endDate", ''), "project"."startDate")`,
        'DESC',
      )
      .addOrderBy(`"project"."startDate"`, 'DESC')
      .addOrderBy(`"project"."id"`, 'DESC')
      .getMany();

    return experiences.map((experience) => ({
      ...experience,
      projects: this.sortProjects(experience.projects || []),
    }));
  }

  async update(id: number, dto: UpdateExperienceDto): Promise<Experience> {
    return this.experienceRepository.manager.transaction(async (manager) => {
      const experienceRepository = manager.getRepository(Experience);
      const exp = await experienceRepository.findOne({ where: { id } });
      if (!exp) throw new NotFoundException('경험을 찾을 수 없습니다.');

      const payload = this.normalizePayload(dto);
      if (
        'description' in dto &&
        !payload.resumeHighlights?.length &&
        !('resumeHighlights' in dto) &&
        payload.description
      ) {
        payload.resumeHighlights = extractExperienceHighlights(
          [payload.description],
          2,
        );
      }

      const merged = experienceRepository.merge(exp, payload);
      const saved = await experienceRepository.save(merged);

      if (dto.linkedProjectIds !== undefined) {
        await this.syncLinkedProjects(saved.id, dto.linkedProjectIds, manager);
      }

      return (await this.findOneWithLinkedProjects(saved.id, manager)) ?? saved;
    });
  }

  async remove(id: number): Promise<void> {
    const exp = await this.experienceRepository.findOne({ where: { id } });
    if (!exp) throw new NotFoundException('경험을 찾을 수 없습니다.');
    await this.experienceRepository.remove(exp);
  }

  private normalizePayload(dto: CreateExperienceDto | UpdateExperienceDto): Partial<Experience> {
    const payload: Partial<Experience> = {};

    if ('type' in dto && dto.type !== undefined) {
      payload.type =
        dto.type === 'team_project' || dto.type === 'club'
          ? dto.type
          : 'career';
    }

    if ('title' in dto && dto.title !== undefined) {
      payload.title = dto.title.trim();
    }

    if ('organization' in dto && dto.organization !== undefined) {
      payload.organization = dto.organization.trim();
    }

    if ('startDate' in dto && dto.startDate !== undefined) {
      payload.startDate = dto.startDate.trim();
    }

    if ('endDate' in dto) {
      payload.endDate = dto.endDate?.trim() ? dto.endDate.trim() : null;
    }

    if ('description' in dto) {
      payload.description = dto.description?.trim() || null;
    }

    if ('resumeVisible' in dto && dto.resumeVisible !== undefined) {
      payload.resumeVisible = Boolean(dto.resumeVisible);
    }

    if ('resumeOrder' in dto && dto.resumeOrder !== undefined) {
      payload.resumeOrder = Math.max(0, dto.resumeOrder);
    }

    if ('resumeHighlights' in dto) {
      payload.resumeHighlights = dto.resumeHighlights
        ? normalizeResumeStringArray(dto.resumeHighlights, 2)
        : [];
    }

    return payload;
  }

  private sanitizeLinkedProjectIds(linkedProjectIds?: number[]): number[] {
    if (!linkedProjectIds) {
      return [];
    }

    return [
      ...new Set(
        linkedProjectIds.filter((projectId) => Number.isInteger(projectId) && projectId > 0),
      ),
    ];
  }

  private sortProjects(projects: Project[]): Project[] {
    return [...projects].sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return left.isFeatured ? -1 : 1;
      }

      if (
        left.isFeatured &&
        right.isFeatured &&
        left.featuredOrder !== right.featuredOrder
      ) {
        return left.featuredOrder - right.featuredOrder;
      }

      const rightDate = new Date(right.endDate || right.startDate || 0).getTime();
      const leftDate = new Date(left.endDate || left.startDate || 0).getTime();
      if (leftDate !== rightDate) {
        return rightDate - leftDate;
      }

      return right.id - left.id;
    });
  }

  private async findOneWithLinkedProjects(
    id: number,
    manager?: EntityManager,
  ): Promise<Experience | null> {
    const experienceRepository = manager
      ? manager.getRepository(Experience)
      : this.experienceRepository;
    const experience = await experienceRepository.findOne({
      where: { id },
      relations: ['projects'],
    });

    if (!experience) {
      return null;
    }

    experience.projects = this.sortProjects(experience.projects || []);
    return experience;
  }

  private async syncLinkedProjects(
    experienceId: number,
    linkedProjectIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    const projectRepository = manager.getRepository(Project);
    const normalizedIds = this.sanitizeLinkedProjectIds(linkedProjectIds);

    if (normalizedIds.length === 0) {
      await projectRepository
        .createQueryBuilder()
        .update(Project)
        .set({ experienceId: null })
        .where(`"experienceId" = :experienceId`, { experienceId })
        .execute();
      return;
    }

    const targetProjects = await projectRepository.find({
      where: { id: In(normalizedIds) },
    });

    if (targetProjects.length !== normalizedIds.length) {
      throw new BadRequestException('연결할 프로젝트 일부를 찾을 수 없습니다.');
    }

    await projectRepository
      .createQueryBuilder()
      .update(Project)
      .set({ experienceId: null })
      .where(`"experienceId" = :experienceId`, { experienceId })
      .andWhere(`"id" NOT IN (:...projectIds)`, { projectIds: normalizedIds })
      .execute();

    await projectRepository
      .createQueryBuilder()
      .update(Project)
      .set({ experienceId })
      .where(`"id" IN (:...projectIds)`, { projectIds: normalizedIds })
      .execute();
  }
}
