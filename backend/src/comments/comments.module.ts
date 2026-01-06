import {TypeOrmModule} from "@nestjs/typeorm";
import {Module} from "@nestjs/common";
import {Comment} from "./entity/comment.entity";
import {CommentsController} from "./controller/comments.controller";
import {CommentsService} from "./service/comments.service";

@Module({
    imports: [TypeOrmModule.forFeature([Comment])],
    controllers: [CommentsController],
    providers: [CommentsService]
})
export class CommentsModule {}