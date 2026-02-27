import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';
import { StorageService } from '../storage/storage.service';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES,
    },
  }))
  @ApiOperation({ summary: '이미지 업로드 (관리자)' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.uploadPublicFile(file, 'media');
    return { url };
  }
}
