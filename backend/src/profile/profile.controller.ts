import { Controller, Get, Put, Body, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
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

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {
    ensureUploadDir();
  }

  @Get()
  @ApiOperation({ summary: '프로필 조회' })
  async getProfile() {
    const profile = await this.profileService.getProfile();
    return { data: profile };
  }

  @Put()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '프로필 업데이트 (관리자)' })
  async updateProfile(@Body() updateDto: UpdateProfileDto) {
    const profile = await this.profileService.updateProfile(updateDto);
    return { data: profile };
  }

  @Post('image')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: fileNameGenerator,
    }),
  }))
  @ApiOperation({ summary: '프로필 이미지 업로드 (관리자)' })
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = file ? `/uploads/${file.filename}` : '';
    if (imageUrl) {
      await this.profileService.updateProfile({ profileImage: imageUrl });
    }
    return { imageUrl };
  }
}
