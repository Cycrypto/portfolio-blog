import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/entity/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // 관리자 계정 정보
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';

    // 이미 존재하는지 확인
    const existingUser = await usersService.findByUsername(username);
    if (existingUser) {
      console.log(`사용자 '${username}'이 이미 존재합니다.`);
      await app.close();
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 관리자 계정 생성
    const admin = await usersService.create({
      username,
      password: hashedPassword,
      email,
      roles: [UserRole.ADMIN],
    });

    console.log('관리자 계정이 생성되었습니다:');
    console.log(`- 사용자명: ${admin.username}`);
    console.log(`- 이메일: ${admin.email}`);
    console.log(`- 역할: ${admin.roles.join(', ')}`);
    console.log('\n로그인 정보:');
    console.log(`- 사용자명: ${username}`);
    console.log(`- 비밀번호: ${password}`);
  } catch (error) {
    console.error('관리자 계정 생성 중 오류 발생:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
