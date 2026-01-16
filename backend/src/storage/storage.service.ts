import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

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
      return '';
    }

    const extension = extname(file.originalname);
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
