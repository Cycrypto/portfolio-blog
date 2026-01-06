import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {LoggerMiddleware} from "./common/middleware/logger.middleware";
import {PostsModule} from './posts/posts.module';
import {CommentsModule} from './comments/comments.module';
import {AuthModule} from "./auth/auth.module";
import {JwtStrategy} from "./auth/common/jwt.strategy";
import { ProfileModule } from './profile/profile.module';
import { ProjectsModule } from './projects/projects.module';
import { MediaModule } from './media/media.module';
import { StatsModule } from './stats/stats.module';
import { ExperienceModule } from './experience/experience.module';
import { ContactModule } from './contact/contact.module';
import { UsersModule } from './users/users.module';

//Module : Nest의 가장 기본적인 구성 단위
@Module({
    imports: [
        // env파일 읽을 수 있게 만드는 모듈
        //isGlobal: true로 하면 다른 모듈에서 따로 import 안해도 됨
        ConfigModule.forRoot({isGlobal: true}),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            // 프로젝트 내 .entity 또는 .entity.js 파일을 모두 등록
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: true, // SQL 로그를 확인할 수 있도록 추가
        }),
        AuthModule,
        UsersModule,
        PostsModule,
        CommentsModule,
        ProfileModule,
        ProjectsModule,
        MediaModule,
        StatsModule,
        ExperienceModule,
        ContactModule,
    ],
    controllers: [AppController],
    providers: [AppService, JwtStrategy],
})

export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes("*")
    }
}
