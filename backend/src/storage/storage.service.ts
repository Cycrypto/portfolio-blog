import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = configService.get<string>('S3_ENDPOINT');
    const accessKeyId = configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = configService.get<string>('S3_SECRET_KEY');
    const region = configService.get<string>('S3_REGION') || 'us-east-1';
    const bucket = configService.get<string>('S3_BUCKET');
    const publicUrl = configService.get<string>('S3_PUBLIC_URL');

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'Missing MinIO configuration. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, and S3_BUCKET.',
      );
    }

    const normalizedEndpoint = endpoint.replace(/\/$/, '');

    this.bucket = bucket;
    this.publicBaseUrl = publicUrl
      ? publicUrl.replace(/\/$/, '')
      : `${normalizedEndpoint}/${bucket}`;

    this.client = new S3Client({
      region,
      endpoint: normalizedEndpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadPublicFile(file: Express.Multer.File | undefined, prefix = 'uploads'): Promise<string> {
    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('파일 크기는 5MB 이하여야 합니다.');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다.');
    }

    const extension = MIME_EXTENSION_MAP[file.mimetype] || extname(file.originalname).toLowerCase();
    const key = `${prefix}/${randomUUID()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicBaseUrl}/${key}`;
  }
}
