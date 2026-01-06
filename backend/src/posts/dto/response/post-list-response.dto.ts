import { ApiProperty } from '@nestjs/swagger';
import { PostListItemDTO } from './post-list-item.dto';

export class PostListResponseDTO {
    @ApiProperty({ type: [PostListItemDTO], description: '포스트 목록' })
    data: PostListItemDTO[];

    @ApiProperty({ description: '전체 포스트 개수', example: 42 })
    totalCount: number;
}
