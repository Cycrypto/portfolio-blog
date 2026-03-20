import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { Profile } from '../profile/profile.entity';
import { ContactMessage } from './contact.entity';
import { ContactNotificationService } from './contact-notification.service';

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ContactNotificationService', () => {
  let service: ContactNotificationService;
  let configValues: Record<string, string | undefined>;
  let configService: Pick<ConfigService, 'get'>;
  let profileRepository: MockRepository<Profile>;
  let fetchMock: jest.Mock;
  const originalFetch = global.fetch;

  const contact = {
    id: 7,
    name: '문의자',
    email: 'sender@example.com',
    subject: '프로젝트 문의',
    message: '안녕하세요\n상담 가능할까요?',
    isRead: false,
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
  } as ContactMessage;

  beforeEach(() => {
    configValues = {};
    configService = {
      get: jest.fn((key: string) => configValues[key]),
    };
    profileRepository = {
      findOne: jest.fn(),
    };
    fetchMock = jest.fn();
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    service = new ContactNotificationService(
      configService as ConfigService,
      profileRepository as unknown as Repository<Profile>,
    );
  });

  afterEach(() => {
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    });
    jest.restoreAllMocks();
  });

  it('sends the notification through Resend with the configured recipient', async () => {
    configValues = {
      RESEND_API_KEY: 're_test_key',
      CONTACT_NOTIFICATION_TO_EMAIL: 'owner@example.com',
      CONTACT_NOTIFICATION_FROM_EMAIL: 'noreply@example.com',
      CONTACT_NOTIFICATION_FROM_NAME: 'Junha Blog',
    };
    fetchMock.mockResolvedValue({ ok: true });

    const result = await service.sendNewContactNotification(contact);

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer re_test_key',
        'Content-Type': 'application/json',
      },
    });

    const body = JSON.parse(options.body as string);
    expect(body.to).toEqual(['owner@example.com']);
    expect(body.from).toBe('Junha Blog <noreply@example.com>');
    expect(body.reply_to).toBe('sender@example.com');
    expect(body.subject).toBe('[블로그 문의] 프로젝트 문의');
    expect(body.text).toContain('이름: 문의자');
    expect(body.html).toContain('sender@example.com');
    expect(body.html).toContain('상담 가능할까요?');
  });

  it('falls back to the profile email when an explicit recipient is missing', async () => {
    configValues = {
      RESEND_API_KEY: 're_test_key',
    };
    profileRepository.findOne!.mockResolvedValue({
      id: 1,
      email: 'profile@example.com',
    });
    fetchMock.mockResolvedValue({ ok: true });

    await service.sendNewContactNotification(contact);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(profileRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(body.to).toEqual(['profile@example.com']);
  });

  it('skips email delivery when the Resend API key is missing', async () => {
    const result = await service.sendNewContactNotification(contact);

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
