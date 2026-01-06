import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../../users/users.service";
import * as bcrypt from 'bcrypt';
import { LoginDto } from "../dto/login.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;

        // 사용자 찾기
        const user = await this.usersService.findByUsername(username);
        if (!user) {
            throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다.');
        }

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다.');
        }

        // JWT 토큰 생성
        const payload = {
            sub: user.id,
            username: user.username,
            roles: user.roles,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                roles: user.roles,
            },
        };
    }

    async validateUser(userId: number) {
        return this.usersService.findById(userId);
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        // 사용자 찾기
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
        }

        // 현재 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
        }

        // 새 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 비밀번호 업데이트
        await this.usersService.updatePassword(userId, hashedPassword);

        return { message: '비밀번호가 성공적으로 변경되었습니다.' };
    }

    getDevAccessToken() {
        const mockUser = {
            userId: 1,
            username: 'admin',
            roles: ['admin']
        };

        const payload = {
            sub: mockUser.userId,
            username: mockUser.username,
            roles: mockUser.roles
        };

        return this.jwtService.sign(payload);
    }
}
