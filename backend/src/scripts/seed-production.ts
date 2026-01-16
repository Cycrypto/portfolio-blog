import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/entity/user.entity';

/**
 * 운영 환경용 관리자 계정 생성 스크립트
 *
 * 사용법:
 * 1. 환경변수 설정:
 *    ADMIN_USERNAME=your_username
 *    ADMIN_PASSWORD=your_secure_password
 *    ADMIN_EMAIL=your_email@domain.com
 *
 * 2. 로컬에서 실행:
 *    npm run create-admin
 *
 * 3. Docker 컨테이너에서 실행:
 *    docker-compose -f docker-compose.prod.yml exec backend npm run create-admin
 */
async function seedProduction() {
  console.log('🚀 관리자 계정 생성 시작...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // 환경변수에서 관리자 정보 가져오기
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@junha.space';

    // 운영 환경에서 기본 비밀번호 사용 경고
    if (process.env.NODE_ENV === 'production' && password === 'admin123') {
      console.error('❌ 오류: 운영 환경에서는 기본 비밀번호를 사용할 수 없습니다.');
      console.error('   ADMIN_PASSWORD 환경변수를 설정해주세요.\n');
      await app.close();
      process.exit(1);
    }

    // 비밀번호 강도 체크
    if (password.length < 8) {
      console.error('❌ 오류: 비밀번호는 최소 8자 이상이어야 합니다.\n');
      await app.close();
      process.exit(1);
    }

    // 이미 존재하는지 확인
    const existingUser = await usersService.findByUsername(username);
    if (existingUser) {
      console.log(`⚠️  사용자 '${username}'이 이미 존재합니다.`);
      console.log(`   생성 시각: ${existingUser.createdAt}`);
      console.log(`   역할: ${existingUser.roles.join(', ')}\n`);

      // 기존 사용자가 admin 권한이 없으면 추가
      if (!existingUser.roles.includes(UserRole.ADMIN)) {
        console.log('🔧 ADMIN 권한 추가 중...');
        existingUser.roles.push(UserRole.ADMIN);
        await usersService.create(existingUser);
        console.log('✅ ADMIN 권한이 추가되었습니다.\n');
      }

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

    console.log('✅ 관리자 계정이 성공적으로 생성되었습니다!\n');
    console.log('═'.repeat(60));
    console.log('   계정 정보:');
    console.log(`   - 사용자명: ${admin.username}`);
    console.log(`   - 이메일: ${admin.email}`);
    console.log(`   - 역할: ${admin.roles.join(', ')}`);
    console.log(`   - 생성 시각: ${admin.createdAt}`);
    console.log('═'.repeat(60));
    console.log('\n📝 로그인 정보:');
    console.log(`   - URL: https://junha.space/admin`);
    console.log(`   - 사용자명: ${username}`);
    console.log(`   - 비밀번호: ${password.replace(/./g, '*')} (환경변수 확인)`);
    console.log('\n⚠️  보안 권장사항:');
    console.log('   1. 로그인 후 즉시 비밀번호를 변경하세요.');
    console.log('   2. 환경변수에서 ADMIN_PASSWORD를 제거하세요.');
    console.log('   3. 이 로그를 안전하게 삭제하세요.\n');

  } catch (error) {
    console.error('❌ 관리자 계정 생성 중 오류 발생:', error.message);
    console.error(error);
    await app.close();
    process.exit(1);
  }

  await app.close();
  console.log('✅ 스크립트 실행 완료\n');
}

seedProduction();
