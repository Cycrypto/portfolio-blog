import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { normalizeUrlFieldsInPlace } from '../common/utils/url.util';

const defaultProfile: Partial<Profile> = {
  name: '박준하',
  title: '백엔드 개발자',
  subtitle: '문제를 구조화하고 안정적인 백엔드 시스템을 설계하는 개발자입니다.',
  email: '',
  location: '서울, 대한민국',
  status: '프로필 정리 중',
  statusMessage: '현재 포트폴리오 정보를 정리하고 있습니다',
  github: '',
  linkedin: '',
  about: '백엔드 개발 경험과 기술 기록을 정리하고 있습니다.',
  description: '프로필 정보를 불러오지 못해 기본 메시지로 표시 중입니다.',
  skills: [],
  profileImage: '',
  isAvailable: true,
  showStatus: true,
};

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async getProfile(): Promise<Profile> {
    let profile = await this.profileRepository.findOne({ where: { id: 1 } });
    if (!profile) {
      profile = this.profileRepository.create({ id: 1, ...defaultProfile });
      await this.profileRepository.save(profile);
    }

    if (normalizeUrlFieldsInPlace(profile, ['github', 'linkedin'])) {
      profile = await this.profileRepository.save(profile);
    }

    return profile;
  }

  async updateProfile(updateDto: UpdateProfileDto): Promise<Profile> {
    let profile = await this.profileRepository.findOne({ where: { id: 1 } });
    if (!profile) {
      profile = this.profileRepository.create({ id: 1, ...defaultProfile });
    }

    normalizeUrlFieldsInPlace(updateDto, ['github', 'linkedin']);
    const merged = this.profileRepository.merge(profile, updateDto);
    return this.profileRepository.save(merged);
  }
}
