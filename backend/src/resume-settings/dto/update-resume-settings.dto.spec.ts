import { validate } from 'class-validator';

import { UpdateResumeSettingsDto } from './update-resume-settings.dto';

describe('UpdateResumeSettingsDto', () => {
  it('accepts summary bullets, featured skills, and selected projects within limits', async () => {
    const dto = Object.assign(new UpdateResumeSettingsDto(), {
      summaryBullets: ['문제를 구조화합니다.', '설계를 구현으로 연결합니다.'],
      featuredSkillNames: ['NestJS', 'PostgreSQL', 'Docker'],
      selectedProjectIds: [1, 2, 3],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects selected projects beyond the PDF limit', async () => {
    const dto = Object.assign(new UpdateResumeSettingsDto(), {
      selectedProjectIds: [1, 2, 3, 4],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
  });
});
