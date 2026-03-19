import {
  extractExperienceHighlights,
  extractSummaryBullets,
  normalizeResumeStringArray,
} from './resume-content.util';

describe('resume-content.util', () => {
  it('normalizes array inputs by trimming, deduplicating, and removing empty items', () => {
    expect(
      normalizeResumeStringArray(
        ['  API 설계  ', '', null, '- API 설계', '운영 자동화'],
        3,
      ),
    ).toEqual(['API 설계', '운영 자동화']);
  });

  it('extracts summary bullets while filtering greeting-like low-signal lines', () => {
    expect(
      extractSummaryBullets(
        [
          '안녕하세요. 문제를 구조적으로 정의하고 제품으로 구현합니다.',
          '복잡한 요구사항을 설계 가능한 단위로 정리합니다.',
        ],
        3,
      ),
    ).toEqual([
      '문제를 구조적으로 정의하고 제품으로 구현합니다.',
      '복잡한 요구사항을 설계 가능한 단위로 정리합니다.',
    ]);
  });

  it('extracts short experience highlights from mixed bullet and sentence input', () => {
    expect(
      extractExperienceHighlights(
        [
          '- 실행 가능한 계획 생성에 초점 맞춘 서비스\n- 일정 변화 시 재계획 지원',
        ],
        2,
      ),
    ).toEqual([
      '실행 가능한 계획 생성에 초점 맞춘 서비스',
      '일정 변화 시 재계획 지원',
    ]);
  });
});
