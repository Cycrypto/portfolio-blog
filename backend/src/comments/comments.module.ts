import {TypeOrmModule} from "@nestjs/typeorm";
import {Module} from "@nestjs/common";
import {Comment} from "./entity/comment.entity";
import {CommentsController} from "./controller/comments.controller";
import {CommentsService} from "./service/comments.service";
import {Post} from "../posts/entity/post.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Post])],
    controllers: [CommentsController],
    providers: [CommentsService]
})
export class CommentsModule {}
