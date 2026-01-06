import { IsString, IsEnum, IsOptional, IsDateString, IsArray, IsNumber, IsObject, ValidateIf } from 'class-validator';
import { PostContentType, PostStatus } from "../../entity/post.entity";
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostRequestDTO {
    @ApiProperty({ description: '포스트 제목', required: false, example: '수정된 NestJS 포스트' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ description: '포스트 슬러그 (URL용)', required: false, example: 'updated-nestjs-post' })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty({ description: '포스트 요약', required: false })
    @IsString()
    @IsOptional()
    excerpt?: string;

    @ApiProperty({ description: '콘텐츠 타입', enum: PostContentType, required: false })
    @IsEnum(PostContentType)
    @IsOptional()
    contentType?: PostContentType;

    @ApiProperty({ description: 'Tiptap JSON 콘텐츠', required: false })
    @ValidateIf((o) => o.contentType === PostContentType.TIPTAP)
    @IsObject()
    @IsOptional()
    contentJson?: Record<string, unknown>;

    @ApiProperty({ description: 'Markdown 콘텐츠', required: false })
    @ValidateIf((o) => o.contentType === PostContentType.MARKDOWN)
    @IsString()
    @IsOptional()
    contentMarkdown?: string;

    @ApiProperty({ description: '대표 이미지 URL', required: false })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiProperty({ description: '태그 배열', type: [String], required: false, example: ['nestjs', 'refactoring'] })
    @IsArray()
    @IsOptional()
    tags?: string[];

    @ApiProperty({ description: '포스트 상태', enum: PostStatus, required: false, example: PostStatus.DRAFT })
    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;

    @ApiProperty({ description: '작성자 이름', required: false, example: 'Jane Doe' })
    @IsString()
    @IsOptional()
    author?: string;

    @ApiProperty({ description: '카테고리', required: false, example: 'Programming' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiProperty({ description: '게시일 (ISO 8601 형식)', required: false, example: '2025-09-05T10:00:00Z' })
    @IsDateString()
    @IsOptional()
    publishDate?: string;

    @ApiProperty({ description: '예상 읽기 시간 (분)', required: false, example: 7 })
    @IsNumber()
    @IsOptional()
    readTime?: number;
}
