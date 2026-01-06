import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        description: '사용자명',
        example: 'admin',
    })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({
        description: '비밀번호',
        example: 'password123',
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class LoginResponseDto {
    @ApiProperty({
        description: 'JWT 액세스 토큰',
    })
    access_token: string;

    @ApiProperty({
        description: '사용자 정보',
    })
    user: {
        id: number;
        username: string;
        roles: string[];
    };
}