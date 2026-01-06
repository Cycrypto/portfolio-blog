import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';

function fileNameGenerator(req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
}

function ensureUploadDir() {
  const dir = './uploads';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor() {
    ensureUploadDir();
  }

  @Post('upload')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: fileNameGenerator,
    }),
  }))
  @ApiOperation({ summary: '이미지 업로드 (관리자)' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = file ? `/uploads/${file.filename}` : '';
    return { url };
  }
}
