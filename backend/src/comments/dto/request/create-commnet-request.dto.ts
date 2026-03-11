import {Type} from "class-transformer";
import {IsInt, IsNotEmpty, IsOptional, IsUUID, MaxLength} from "class-validator";

export class CreateCommnetRequestDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    postId?: number;

    @IsOptional()
    @IsUUID()
    parentId?: string;

    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @IsNotEmpty()
    @MaxLength(100)
    authorName: string;

    @IsNotEmpty()
    @MaxLength(100)
    password: string;
}
