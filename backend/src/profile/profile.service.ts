import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

const defaultProfile: Partial<Profile> = {
  name: '박준하',
  title: '백엔드 개발자 & 기술 블로거',
  subtitle: '견고하고 확장 가능한 백엔드 시스템을 설계하고 구축하며, 개발 경험과 지식을 블로그를 통해 공유합니다.',
  email: 'parkjunha@example.com',
  location: '서울, 대한민국',
  status: '새로운 기회 모색 중',
  statusMessage: '새로운 프로젝트와 협업 기회를 찾고 있습니다',
  github: 'https://github.com/parkjunha',
  linkedin: 'https://www.linkedin.com/in/parkjunha/',
  about: '안녕하세요! 저는 5년 경력의 백엔드 개발자 박준하입니다. Java와 Spring 생태계를 중심으로 확장 가능하고 안정적인 서버 시스템을 구축하는 것을 전문으로 합니다.',
  description: '마이크로서비스 아키텍처, 클라우드 네이티브 애플리케이션, 그리고 대용량 트래픽 처리에 대한 경험과 지식을 쌓아왔으며, 이를 블로그를 통해 개발자 커뮤니티와 공유하고 있습니다.',
  skills: [
    { name: 'Java', level: 95 },
    { name: 'Spring Boot', level: 90 },
    { name: 'Spring Security', level: 85 },
    { name: 'JPA/Hibernate', level: 88 },
    { name: 'MySQL', level: 85 },
    { name: 'PostgreSQL', level: 80 },
    { name: 'Redis', level: 75 },
    { name: 'MongoDB', level: 70 },
    { name: 'Docker', level: 85 },
    { name: 'Kubernetes', level: 75 },
    { name: 'AWS', level: 80 },
    { name: 'Jenkins', level: 70 },
  ],
  profileImage: '/placeholder.svg',
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
    return profile;
  }

  async updateProfile(updateDto: UpdateProfileDto): Promise<Profile> {
    let profile = await this.profileRepository.findOne({ where: { id: 1 } });
    if (!profile) {
      profile = this.profileRepository.create({ id: 1, ...defaultProfile });
    }

    const merged = this.profileRepository.merge(profile, updateDto);
    return this.profileRepository.save(merged);
  }
}
