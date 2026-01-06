import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtRoleGuard } from '../auth/common/jwt-role.guard';
import { Roles } from '../auth/decorator/auth-role.decorator';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: '문의 전송' })
  async create(@Body() dto: CreateContactDto) {
    const data = await this.contactService.create(dto);
    return { data };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '문의 목록 조회 (관리자)' })
  async findAll() {
    const data = await this.contactService.findAll();
    return { data };
  }

  @Patch(':id/read')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: '문의 읽음 상태 변경 (관리자)' })
  @ApiParam({ name: 'id', description: '문의 ID' })
  async markRead(
    @Param('id') id: string,
    @Body('isRead') isRead: boolean = true,
  ) {
    const data = await this.contactService.updateRead(parseInt(id, 10), isRead);
    return { data };
  }
}
