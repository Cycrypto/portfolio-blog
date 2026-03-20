import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profile/profile.entity';
import { ContactMessage } from './contact.entity';

function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

function parsePositiveNumberEnv(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

function formatSender(name: string, email: string): string {
  const normalizedName = name.replace(/[<>"]/g, '').trim();
  return normalizedName ? `${normalizedName} <${email}>` : email;
}

@Injectable()
export class ContactNotificationService {
  private readonly logger = new Logger(ContactNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async sendNewContactNotification(contact: ContactMessage): Promise<boolean> {
    if (!this.isNotificationEnabled()) {
      return false;
    }

    const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    if (!apiKey) {
      this.logger.debug(
        'Skipping contact notification email because RESEND_API_KEY is not configured.',
      );
      return false;
    }

    const recipient = await this.getRecipientEmail();
    if (!recipient) {
      this.logger.warn(
        'Skipping contact notification email because no recipient address is configured.',
      );
      return false;
    }

    const fromEmail =
      this.configService
        .get<string>('CONTACT_NOTIFICATION_FROM_EMAIL')
        ?.trim() || 'onboarding@resend.dev';
    const fromName =
      this.configService
        .get<string>('CONTACT_NOTIFICATION_FROM_NAME')
        ?.trim() || '블로그 문의 알림';
    const subjectPrefix =
      this.configService
        .get<string>('CONTACT_NOTIFICATION_SUBJECT_PREFIX')
        ?.trim() || '[블로그 문의]';
    const notificationSubject =
      contact.subject?.trim() || `${contact.name}님의 문의`;

    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      parsePositiveNumberEnv(
        this.configService.get<string>('CONTACT_NOTIFICATION_TIMEOUT_MS'),
        10000,
      ),
    );

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: formatSender(fromName, fromEmail),
          to: [recipient],
          reply_to: contact.email,
          subject: `${subjectPrefix} ${notificationSubject}`.trim(),
          text: this.buildPlainText(contact),
          html: this.buildHtml(contact),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Resend responded with ${response.status} ${errorText || response.statusText}`,
        );
      }

      return true;
    } catch (error) {
      this.logger.warn(
        `Failed to deliver contact notification for contact ${contact.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isNotificationEnabled(): boolean {
    return parseBooleanEnv(
      this.configService.get<string>('CONTACT_NOTIFICATION_ENABLED'),
      true,
    );
  }

  private async getRecipientEmail(): Promise<string | null> {
    const configuredRecipient = this.configService
      .get<string>('CONTACT_NOTIFICATION_TO_EMAIL')
      ?.trim();
    if (configuredRecipient) {
      return configuredRecipient;
    }

    const profile = await this.profileRepository.findOne({ where: { id: 1 } });
    const profileEmail = profile?.email?.trim();
    return profileEmail || null;
  }

  private buildPlainText(contact: ContactMessage): string {
    return [
      '새 문의가 접수되었습니다.',
      '',
      `이름: ${contact.name}`,
      `이메일: ${contact.email}`,
      `제목: ${contact.subject?.trim() || '제목 없음'}`,
      `접수 시각: ${contact.createdAt.toISOString()}`,
      '',
      '메시지:',
      contact.message,
    ].join('\n');
  }

  private buildHtml(contact: ContactMessage): string {
    const safeSubject = escapeHtml(contact.subject?.trim() || '제목 없음');
    const safeName = escapeHtml(contact.name);
    const safeEmail = escapeHtml(contact.email);
    const safeMessage = escapeHtml(contact.message).replace(/\n/g, '<br />');
    const safeCreatedAt = escapeHtml(contact.createdAt.toISOString());

    return `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 16px;">새 문의가 접수되었습니다.</h2>
        <p><strong>이름:</strong> ${safeName}</p>
        <p><strong>이메일:</strong> ${safeEmail}</p>
        <p><strong>제목:</strong> ${safeSubject}</p>
        <p><strong>접수 시각:</strong> ${safeCreatedAt}</p>
        <div style="margin-top: 20px;">
          <strong>메시지</strong>
          <div style="margin-top: 8px; padding: 16px; border-radius: 12px; background: #f3f4f6; white-space: normal;">
            ${safeMessage}
          </div>
        </div>
      </div>
    `.trim();
  }
}
