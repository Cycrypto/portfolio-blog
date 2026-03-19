import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  extractSummaryBullets,
  normalizeResumeStringArray,
} from '../common/utils/resume-content.util';
import { normalizeUrlFieldsInPlace } from '../common/utils/url.util';
import { Profile } from '../profile/profile.entity';
import { Project } from '../projects/project.entity';
import { UpdateResumeSettingsDto } from './dto/update-resume-settings.dto';
import { ResumeSettings } from './resume-settings.entity';

@Injectable()
export class ResumeSettingsService {
  constructor(
    @InjectRepository(ResumeSettings)
    private readonly resumeSettingsRepository: Repository<ResumeSettings>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async getSettings(): Promise<ResumeSettings> {
    const [existing] = await this.resumeSettingsRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });

    if (existing) {
      return existing;
    }

    return this.createDefaultSettings();
  }

  async updateSettings(
    updateResumeSettingsDto: UpdateResumeSettingsDto,
  ): Promise<ResumeSettings> {
    const settings = await this.getSettings();
    const normalizedUpdate = { ...updateResumeSettingsDto };

    normalizeUrlFieldsInPlace(normalizedUpdate, ['github', 'linkedin', 'photoUrl']);

    if (normalizedUpdate.summaryBullets !== undefined) {
      normalizedUpdate.summaryBullets = normalizeResumeStringArray(
        normalizedUpdate.summaryBullets,
        3,
      );
    }

    if (normalizedUpdate.featuredSkillNames !== undefined) {
      normalizedUpdate.featuredSkillNames = normalizeResumeStringArray(
        normalizedUpdate.featuredSkillNames,
        8,
      );
    }

    if ('selectedProjectIds' in normalizedUpdate) {
      normalizedUpdate.selectedProjectIds = await this.filterExistingProjectIds(
        (normalizedUpdate.selectedProjectIds || []).slice(0, 3),
      );
    }

    const merged = this.resumeSettingsRepository.merge(settings, normalizedUpdate);
    return this.resumeSettingsRepository.save(merged);
  }

  private async createDefaultSettings(): Promise<ResumeSettings> {
    const [profile, projects] = await Promise.all([
      this.getPrimaryProfile(),
      this.projectRepository.find({
        order: {
          isFeatured: 'DESC',
          featuredOrder: 'ASC',
          startDate: 'DESC',
          id: 'DESC',
        },
        take: 3,
      }),
    ]);

    const settings = this.resumeSettingsRepository.create({
      name: profile?.name ?? '',
      title: profile?.title ?? '',
      headline: profile?.subtitle ?? '',
      email: profile?.email ?? '',
      location: profile?.location ?? '',
      github: profile?.github ?? '',
      linkedin: profile?.linkedin ?? '',
      photoUrl: profile?.profileImage ?? '',
      showPhoto: true,
      summaryBullets: extractSummaryBullets(
        [profile?.subtitle ?? '', profile?.about ?? '', profile?.description ?? ''],
        3,
      ),
      featuredSkillNames: normalizeResumeStringArray(
        [...(profile?.skills || [])]
          .sort((left, right) => (right?.level || 0) - (left?.level || 0))
          .map((skill) => skill?.name ?? ''),
        8,
      ),
      selectedProjectIds: projects.map((project) => project.id).slice(0, 3),
    });

    normalizeUrlFieldsInPlace(settings, ['github', 'linkedin', 'photoUrl']);

    return this.resumeSettingsRepository.save(settings);
  }

  private async getPrimaryProfile(): Promise<Profile | null> {
    const firstProfile = await this.profileRepository.findOne({ where: { id: 1 } });
    if (firstProfile) {
      return firstProfile;
    }

    const [fallbackProfile] = await this.profileRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });

    return fallbackProfile ?? null;
  }

  private async filterExistingProjectIds(projectIds: number[]): Promise<number[]> {
    const uniqueIds = [...new Set(projectIds.filter((projectId) => projectId > 0))];
    if (uniqueIds.length === 0) {
      return [];
    }

    const existingProjects = await this.projectRepository.find({
      where: { id: In(uniqueIds) },
      select: ['id'],
    });
    const existingIdSet = new Set(existingProjects.map((project) => project.id));

    return uniqueIds.filter((projectId) => existingIdSet.has(projectId));
  }
}
