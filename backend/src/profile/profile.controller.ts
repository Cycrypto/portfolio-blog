import { Controller, Get, Put, Body, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';
import { StorageService } from '../storage/storage.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly storageService: StorageService,
  ) {}

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
    storage: memoryStorage(),
  }))
  @ApiOperation({ summary: '프로필 이미지 업로드 (관리자)' })
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.storageService.uploadPublicFile(file, 'profile');
    if (imageUrl) {
      await this.profileService.updateProfile({ profileImage: imageUrl });
    }
    return { imageUrl };
  }
}
