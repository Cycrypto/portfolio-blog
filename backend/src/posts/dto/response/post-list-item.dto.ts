// src/posts/dto/response/post-list-item.dto.ts
import { PostContentType } from '../../entity/post.entity';

export class PostListItemDTO {
    id: number;  // 포스트 ID
    title: string;  // 포스트 제목
    slug?: string;  // URL slug
    excerpt?: string;  // 포스트 요약
    contentType: PostContentType;  // 콘텐츠 타입
    image?: string;  // 포스트 이미지
    tags?: string[];  // 포스트 태그 (태그 이름 배열)
    status: string;  // 포스트 상태
    author: string;  // 작성자
    category: string;  // 카테고리
    publishDate: string;  // 게시일 (ISO 형식)
    views: number;  // 조회수
    comments: number;  // 댓글 수
    readTime: number;  // 읽는 시간 (분)
}
