import { ApiProperty } from '@nestjs/swagger';
import { PostContentType } from '../../entity/post.entity';

export class PostEditResponseDTO {
    @ApiProperty({ description: '포스트 ID', example: 1 })
    id: number;

    @ApiProperty({ description: '포스트 제목', example: 'NestJS 포스트' })
    title: string;

    @ApiProperty({ description: '포스트 슬러그 (URL용)', required: false, example: 'nestjs-post' })
    slug?: string;

    @ApiProperty({ description: '포스트 요약', required: false })
    excerpt?: string;

    @ApiProperty({ description: '콘텐츠 타입', enum: PostContentType })
    contentType: PostContentType;

    @ApiProperty({ description: 'Tiptap JSON', required: false })
    contentJson?: Record<string, unknown> | null;

    @ApiProperty({ description: 'Markdown 본문', required: false })
    contentMarkdown?: string | null;

    @ApiProperty({ description: '렌더링된 HTML', required: false })
    contentHtml?: string | null;

    @ApiProperty({ description: '대표 이미지 URL', required: false })
    image?: string;

    @ApiProperty({ description: '태그 배열', type: [String], required: false })
    tags?: string[];

    @ApiProperty({ description: '포스트 상태', example: 'published' })
    status: string;

    @ApiProperty({ description: '작성자 이름', example: 'John Doe' })
    author: string;

    @ApiProperty({ description: '카테고리', example: 'Tech' })
    category: string;

    @ApiProperty({ description: '게시일 (ISO 8601 형식)', example: '2025-09-04T10:00:00Z' })
    publishDate: string;

    @ApiProperty({ description: '예상 읽기 시간 (분)', example: 5 })
    readTime: number;
}
