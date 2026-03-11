import { ApiError, apiRequest } from '../client/base';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from '../../types/api';
import {
  CommentCreateException,
  CommentDeleteException,
  CommentIsPrivateException,
  CommentNotFoundException,
  CommentUpdateException,
  CommentValidationException,
} from '../../comments/exceptions';

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
    if (error instanceof ApiError && error.status === 400) {
      throw new CommentValidationException('data', commentData);
    }

    throw new CommentCreateException(commentData.postId, error instanceof Error ? error : undefined, { commentData });
  }
}

export async function updateComment(postId: string, commentId: string, commentData: UpdateCommentRequest): Promise<Comment> {
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

export async function deleteComment(postId: string, commentId: string, password?: string): Promise<void> {
  try {
    await apiRequest(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      requireAuth: !password,
      body: JSON.stringify(password ? { password } : {}),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new CommentNotFoundException(commentId, postId);
      }
      if (error.status === 403) {
        throw new CommentIsPrivateException(
          commentId,
          password ? '댓글 비밀번호가 일치하지 않습니다.' : '삭제 권한이 없습니다.',
        );
      }
      if (error.status === 400 && password !== undefined) {
        throw new CommentValidationException('password', password);
      }
    }

    throw new CommentDeleteException(commentId, error instanceof Error ? error : undefined, { postId });
  }
}
