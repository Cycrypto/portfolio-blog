import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangeUsernameDto {
    @ApiProperty({
        description: '현재 비밀번호 (본인 확인용)',
        example: 'admin123',
    })
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @ApiProperty({
        description: '새 사용자 ID',
        example: 'newadmin',
        minLength: 3,
        maxLength: 20,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3, { message: '사용자 ID는 최소 3자 이상이어야 합니다.' })
    @MaxLength(20, { message: '사용자 ID는 최대 20자까지 가능합니다.' })
    newUsername: string;
}
