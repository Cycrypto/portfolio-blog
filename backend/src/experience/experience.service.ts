import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from './experience.entity';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
  ) {}

  async create(dto: CreateExperienceDto): Promise<Experience> {
    const exp = this.experienceRepository.create(this.normalizePayload(dto));
    return this.experienceRepository.save(exp);
  }

  async findAll(): Promise<Experience[]> {
    return this.experienceRepository
      .createQueryBuilder('experience')
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
      .getMany();
  }

  async update(id: number, dto: UpdateExperienceDto): Promise<Experience> {
    const exp = await this.experienceRepository.findOne({ where: { id } });
    if (!exp) throw new NotFoundException('경험을 찾을 수 없습니다.');
    const merged = this.experienceRepository.merge(exp, this.normalizePayload(dto));
    return this.experienceRepository.save(merged);
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

    return payload;
  }
}
