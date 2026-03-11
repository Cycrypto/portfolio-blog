export class CommentResponseDto {
    id: string;
    postId: number;
    content: string;
    authorName: string;
    parentId?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    replies?: CommentResponseDto[];
}

export class CreateCommentResponseDto {
    success: boolean;
    data: CommentResponseDto;
}

export class GetCommentsResponseDto {
    success: boolean;
    data: CommentResponseDto[];
}
