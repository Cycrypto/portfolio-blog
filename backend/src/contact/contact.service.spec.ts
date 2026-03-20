import type { Repository } from 'typeorm';
import { ContactNotificationService } from './contact-notification.service';
import { ContactMessage } from './contact.entity';
import { ContactService } from './contact.service';

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ContactService', () => {
  let service: ContactService;
  let contactRepository: MockRepository<ContactMessage>;
  let contactNotificationService: {
    sendNewContactNotification: jest.Mock<Promise<boolean>, [ContactMessage]>;
  };

  beforeEach(() => {
    contactRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({
        id: 1,
        isRead: false,
        createdAt: new Date('2026-03-20T00:00:00.000Z'),
        ...value,
      })),
      find: jest.fn(),
      update: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    contactNotificationService = {
      sendNewContactNotification: jest.fn().mockResolvedValue(true),
    };

    service = new ContactService(
      contactRepository as unknown as Repository<ContactMessage>,
      contactNotificationService as unknown as ContactNotificationService,
    );
  });

  it('saves the contact message and triggers an email notification', async () => {
    const result = await service.create({
      name: '홍길동',
      email: 'hong@example.com',
      subject: '협업 문의',
      message: '같이 일할 수 있을까요?',
    });

    expect(contactRepository.create).toHaveBeenCalledWith({
      name: '홍길동',
      email: 'hong@example.com',
      subject: '협업 문의',
      message: '같이 일할 수 있을까요?',
    });
    expect(contactRepository.save).toHaveBeenCalledTimes(1);
    expect(
      contactNotificationService.sendNewContactNotification,
    ).toHaveBeenCalledWith(result);
    expect(result).toMatchObject({
      id: 1,
      name: '홍길동',
      email: 'hong@example.com',
      subject: '협업 문의',
      message: '같이 일할 수 있을까요?',
      isRead: false,
    });
  });

  it('keeps the saved contact when email notification delivery fails', async () => {
    contactNotificationService.sendNewContactNotification.mockRejectedValue(
      new Error('mail transport failed'),
    );

    await expect(
      service.create({
        name: '김메일',
        email: 'kim@example.com',
        message: '안녕하세요',
      }),
    ).resolves.toMatchObject({
      id: 1,
      name: '김메일',
      email: 'kim@example.com',
      message: '안녕하세요',
    });
  });
});
