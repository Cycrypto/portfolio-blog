import { validate } from 'class-validator';

import { CreateExperienceDto } from './create-experience.dto';

describe('CreateExperienceDto', () => {
  it('accepts resume-specific fields within limits', async () => {
    const dto = Object.assign(new CreateExperienceDto(), {
      type: 'career',
      title: '백엔드 개발자',
      organization: '예시 회사',
      startDate: '2025-01',
      resumeVisible: true,
      resumeOrder: 1,
      resumeHighlights: ['API 구조 설계', '운영 자동화 개선'],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects more than two resume highlights', async () => {
    const dto = Object.assign(new CreateExperienceDto(), {
      type: 'career',
      title: '백엔드 개발자',
      organization: '예시 회사',
      startDate: '2025-01',
      resumeHighlights: ['1', '2', '3'],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
  });
});
