import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from "../service/auth.service";
import { LoginDto, LoginResponseDto } from "../dto/login.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";

@ApiTags('Authentication')
@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {}

    @Post('login')
    @ApiOperation({
        summary: '로그인',
        description: '사용자명과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.'
    })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: '로그인 성공',
        type: LoginResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: '인증 실패 (잘못된 사용자명 또는 비밀번호)'
    })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '비밀번호 변경',
        description: '로그인한 사용자의 비밀번호를 변경합니다.'
    })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({
        status: 200,
        description: '비밀번호 변경 성공',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: '비밀번호가 성공적으로 변경되었습니다.'
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: '인증 실패 또는 현재 비밀번호 불일치'
    })
    async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(
            req.user.userId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword
        );
    }

    // 개발용 토큰 발급 - 운영 환경에서는 비활성화
    // 환경 변수 ENABLE_DEV_TOKEN=true 일 때만 활성화
    @Post('dev-token')
    @ApiOperation({
        summary: '개발용 토큰 발급 (개발 전용)',
        description: '개발 및 테스트를 위한 JWT 토큰을 발급합니다. 운영 환경에서는 비활성화됩니다.'
    })
    @ApiResponse({
        status: 200,
        description: '토큰이 성공적으로 발급됨',
        schema: {
            type: 'object',
            properties: {
                access_token: {
                    type: 'string',
                    description: 'JWT 액세스 토큰'
                }
            }
        }
    })
    @ApiResponse({
        status: 403,
        description: '개발용 토큰 발급이 비활성화됨'
    })
    getDevAccessToken() {
        // 운영 환경에서는 비활성화
        if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_TOKEN !== 'true') {
            throw new Error('개발용 토큰 발급은 개발 환경에서만 사용 가능합니다.');
        }
        return { access_token: this.authService.getDevAccessToken() };
    }
}