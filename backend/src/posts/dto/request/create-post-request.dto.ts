import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional, IsArray, IsNumber, IsObject, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostContentType } from '../../entity/post.entity';

export class CreatePostRequestDTO {
    @ApiProperty({ description: '포스트 제목', example: '새로운 NestJS 포스트' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: '포스트 슬러그 (URL용)', required: false, example: 'new-nestjs-post' })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty({ description: '포스트 요약', required: false })
    @IsString()
    @IsOptional()
    excerpt?: string;

    @ApiProperty({ description: '콘텐츠 타입', enum: PostContentType })
    @IsEnum(PostContentType)
    @IsNotEmpty()
    contentType: PostContentType;

    @ApiProperty({ description: 'Tiptap JSON 콘텐츠', required: false })
    @ValidateIf((o) => o.contentType === PostContentType.TIPTAP)
    @IsObject()
    contentJson?: Record<string, unknown>;

    @ApiProperty({ description: 'Markdown 콘텐츠', required: false })
    @ValidateIf((o) => o.contentType === PostContentType.MARKDOWN)
    @IsString()
    contentMarkdown?: string;

    @ApiProperty({ description: '대표 이미지 URL', required: false })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiProperty({ description: '태그 배열', type: [String], required: false, example: ['nestjs', 'typescript'] })
    @IsArray()
    @IsOptional()
    tags?: string[];

    @ApiProperty({ description: '포스트 상태', example: 'published' })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({ description: '작성자 이름', example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    author: string;

    @ApiProperty({ description: '카테고리', example: 'Tech' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({ description: '게시일 (ISO 8601 형식)', example: '2025-09-04T10:00:00Z' })
    @IsDateString()
    @IsNotEmpty()
    publishDate: string;

    @ApiProperty({ description: '예상 읽기 시간 (분)', required: false, example: 5 })
    @IsNumber()
    @IsOptional()
    readTime?: number;
}
