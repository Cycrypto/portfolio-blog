import {IsNotEmpty, IsOptional, IsUUID, MaxLength} from "class-validator";

export class CreateCommnetRequestDto {
    @IsNotEmpty()
    postId: string

    @IsOptional()
    @IsUUID()
    parentId?: string;

    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @IsNotEmpty()
    authorName: string;

    @IsNotEmpty()
    authorEmail: string;
}