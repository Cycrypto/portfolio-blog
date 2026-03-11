import { IsNotEmpty, MaxLength } from "class-validator";

export class UpdateCommentRequestDto {
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @IsNotEmpty()
    @MaxLength(200)
    password: string;
}
