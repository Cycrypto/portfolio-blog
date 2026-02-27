import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
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

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) {
        return defaultValue;
    }

    return value.toLowerCase() === 'true';
}

//Module : Nest의 가장 기본적인 구성 단위
@Module({
    imports: [
        // env파일 읽을 수 있게 만드는 모듈
        //isGlobal: true로 하면 다른 모듈에서 따로 import 안해도 됨
        ConfigModule.forRoot({isGlobal: true}),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const isProduction = configService.get<string>('NODE_ENV') === 'production';

                return {
                    type: 'postgres',
                    host: configService.get<string>('DB_HOST'),
                    port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
                    username: configService.get<string>('DB_USERNAME'),
                    password: configService.get<string>('DB_PASSWORD'),
                    database: configService.get<string>('DB_DATABASE'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: parseBooleanEnv(configService.get<string>('DB_SYNCHRONIZE'), !isProduction),
                    logging: parseBooleanEnv(configService.get<string>('DB_LOGGING'), !isProduction),
                };
            },
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
