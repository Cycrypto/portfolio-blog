import { InternalServerException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 댓글 생성 실패 시 발생하는 예외
 */
export class CommentCreateException extends InternalServerException {
  constructor(postId: string, originalError?: Error, details?: any) {
    super(ErrorCode.COMMENT_CREATE_FAILED, '댓글 생성에 실패했습니다.', {
      postId,
      originalError: originalError?.message,
      ...details,
    });
  }
}

/**
 * 댓글 수정 실패 시 발생하는 예외
 */
export class CommentUpdateException extends InternalServerException {
  constructor(commentId: string, originalError?: Error, details?: any) {
    super(ErrorCode.COMMENT_UPDATE_FAILED, '댓글 수정에 실패했습니다.', {
      commentId,
      originalError: originalError?.message,
      ...details,
    });
  }
}

/**
 * 댓글 삭제 실패 시 발생하는 예외
 */
export class CommentDeleteException extends InternalServerException {
  constructor(commentId: string, originalError?: Error, details?: any) {
    super(ErrorCode.COMMENT_DELETE_FAILED, '댓글 삭제에 실패했습니다.', {
      commentId,
      originalError: originalError?.message,
      ...details,
    });
  }
}
