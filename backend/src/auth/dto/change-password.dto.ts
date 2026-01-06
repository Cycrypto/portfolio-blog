import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        description: '현재 비밀번호',
        example: 'admin123',
    })
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @ApiProperty({
        description: '새 비밀번호',
        example: 'newPassword123!',
        minLength: 6,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
    newPassword: string;
}
