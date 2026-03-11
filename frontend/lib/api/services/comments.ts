import { apiRequest } from '../client/base';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from '../../types/api';
import { 
  CommentNotFoundException, 
  CommentCreateException, 
  CommentUpdateException, 
  CommentDeleteException,
  CommentValidationException,
  CommentIsPrivateException 
} from '../../comments/exceptions';
import { ApiError } from '../client/base';

export async function getComments(postId: string): Promise<{success: boolean, data: {success: boolean, data: Comment[]}}> {
  try {
    const result = await apiRequest<{success: boolean, data: {success: boolean, data: Comment[]}}>(
      `/posts/${postId}/comments`,
      { requireAuth: false }
    );
    return result;
  } catch (error) {
    throw error;
  }
}

export async function createComment(commentData: CreateCommentRequest): Promise<Comment> {
  // 입력 데이터 검증
  if (!commentData.content?.trim()) {
    throw new CommentValidationException('content', commentData.content);
  }
  if (!commentData.authorName?.trim()) {
    throw new CommentValidationException('authorName', commentData.authorName);
  }
  if (!commentData.password?.trim()) {
    throw new CommentValidationException('password', commentData.password);
  }

  try {
    const result = await apiRequest<{ data: Comment }>(
      `/posts/${commentData.postId}/comments`,
      {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify(commentData),
      }
    );
    
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400) {
        throw new CommentValidationException('data', commentData);
      }
    }
    throw new CommentCreateException(commentData.postId, error instanceof Error ? error : undefined, { commentData });
  }
}

export async function updateComment(postId: string, commentId: string, commentData: UpdateCommentRequest): Promise<Comment> {
  // 입력 데이터 검증
  if (!commentData.content?.trim()) {
    throw new CommentValidationException('content', commentData.content);
  }
  if (!commentData.password?.trim()) {
    throw new CommentValidationException('password', commentData.password);
  }

  try {
    const result = await apiRequest<{ data: Comment }>(
      `/posts/${postId}/comments/${commentId}`,
      {
        method: 'PATCH',
        requireAuth: false,
        body: JSON.stringify(commentData),
      }
    );
    
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new CommentNotFoundException(commentId, postId);
      }
      if (error.status === 403) {
        throw new CommentIsPrivateException(commentId, '댓글 비밀번호가 일치하지 않습니다.');
      }
      if (error.status === 400) {
        throw new CommentValidationException('data', commentData);
      }
    }
    throw new CommentUpdateException(commentId, error instanceof Error ? error : undefined, { postId, commentData });
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  try {
    await apiRequest(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new CommentNotFoundException(commentId, postId);
      }
      if (error.status === 403) {
        throw new CommentIsPrivateException(commentId);
      }
    }
    throw new CommentDeleteException(commentId, error instanceof Error ? error : undefined, { postId });
  }
}
