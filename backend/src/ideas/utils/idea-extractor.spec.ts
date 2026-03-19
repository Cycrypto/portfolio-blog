import {
  createSourceFingerprint,
  extractIdeaCandidates,
  normalizeConversationText,
  type IdeaInputMessage,
} from './idea-extractor';

describe('idea-extractor', () => {
  it('extracts ranked candidates from mixed technical conversation', () => {
    const messages: IdeaInputMessage[] = [
      {
        order: 0,
        role: 'user',
        text: 'NestJS에서 JWT 인증 구현 중 401 에러가 나요. TypeORM 쿼리도 같이 보고 싶어요.',
      },
      {
        order: 1,
        role: 'assistant',
        text: [
          'NestJS AuthGuard와 JWT payload를 같이 확인해보세요.',
          '```ts',
          'return this.jwtService.sign(payload)',
          '```',
          'TypeORM query builder에서 user relation도 점검하세요.',
        ].join('\n'),
      },
      {
        order: 2,
        role: 'user',
        text: '해결 방법과 정리 포인트를 블로그로 남기고 싶어요.',
      },
    ];

    const candidates = extractIdeaCandidates({
      sourceTitle: 'NestJS 인증 구현 대화 - ChatGPT',
      messages,
    });

    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates[0].title).toContain('NestJS');
    expect(
      candidates.some((candidate) =>
        candidate.tags.some((tag) => ['NestJS', 'Auth', 'TypeORM'].includes(tag)),
      ),
    ).toBe(true);
  });

  it('creates a stable fingerprint from normalized text and url', () => {
    const url = 'https://chatgpt.com/c/abc';
    const messages: IdeaInputMessage[] = [
      { order: 0, role: 'user', text: '  React   에러 정리  ' },
    ];

    const fingerprintA = createSourceFingerprint(url, messages);
    const fingerprintB = createSourceFingerprint(url, [
      { order: 0, role: 'user', text: 'React 에러 정리' },
    ]);

    expect(normalizeConversationText(messages)).toBe('React 에러 정리');
    expect(fingerprintA).toBe(fingerprintB);
  });
});
