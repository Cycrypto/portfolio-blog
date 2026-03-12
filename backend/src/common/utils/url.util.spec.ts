import { normalizeUrl, normalizeUrlFieldsInPlace } from './url.util';

describe('url.util', () => {
  describe('normalizeUrl', () => {
    it('prepends https to domain-like values', () => {
      expect(normalizeUrl('linkedin.com/in/junha')).toBe('https://linkedin.com/in/junha');
      expect(normalizeUrl('www.google.com/search?q=test')).toBe('https://www.google.com/search?q=test');
      expect(normalizeUrl('localhost:3000/demo')).toBe('https://localhost:3000/demo');
    });

    it('preserves absolute and relative values', () => {
      expect(normalizeUrl('https://junha.space')).toBe('https://junha.space');
      expect(normalizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(normalizeUrl('#contact')).toBe('#contact');
      expect(normalizeUrl('/blog/post')).toBe('/blog/post');
    });

    it('drops dangerous protocols', () => {
      expect(normalizeUrl('javascript:alert(1)')).toBe('');
      expect(normalizeUrl('data:text/html;base64,abc')).toBe('');
    });
  });

  describe('normalizeUrlFieldsInPlace', () => {
    it('normalizes only configured string fields', () => {
      const target = {
        github: 'github.com/junha',
        linkedin: 'https://linkedin.com/in/junha',
        title: 'profile',
      };

      const changed = normalizeUrlFieldsInPlace(target, ['github', 'linkedin']);

      expect(changed).toBe(true);
      expect(target.github).toBe('https://github.com/junha');
      expect(target.linkedin).toBe('https://linkedin.com/in/junha');
      expect(target.title).toBe('profile');
    });
  });
});
