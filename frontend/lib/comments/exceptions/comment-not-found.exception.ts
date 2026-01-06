import { NotFoundException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 댓글을 찾을 수 없을 때 발생하는 예외
 */
export class CommentNotFoundException extends NotFoundException {
  constructor(commentId?: string, postId?: string, details?: any) {
    const message = commentId 
      ? `ID가 '${commentId}'인 댓글을 찾을 수 없습니다.`
      : '댓글을 찾을 수 없습니다.';
    
    super(ErrorCode.COMMENT_NOT_FOUND, message, {
      commentId,
      postId,
      ...details,
    });
  }
}
