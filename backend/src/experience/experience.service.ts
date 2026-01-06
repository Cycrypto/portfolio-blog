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
    const exp = this.experienceRepository.create(dto);
    return this.experienceRepository.save(exp);
  }

  async findAll(): Promise<Experience[]> {
    return this.experienceRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateExperienceDto): Promise<Experience> {
    const exp = await this.experienceRepository.findOne({ where: { id } });
    if (!exp) throw new NotFoundException('경력을 찾을 수 없습니다.');
    const merged = this.experienceRepository.merge(exp, dto);
    return this.experienceRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const exp = await this.experienceRepository.findOne({ where: { id } });
    if (!exp) throw new NotFoundException('경력을 찾을 수 없습니다.');
    await this.experienceRepository.remove(exp);
  }
}
