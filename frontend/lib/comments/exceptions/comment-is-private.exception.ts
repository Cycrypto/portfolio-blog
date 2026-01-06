import { ForbiddenException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 비공개 댓글에 접근하려고 할 때 발생하는 예외
 */
export class CommentIsPrivateException extends ForbiddenException {
  constructor(commentId?: string, details?: any) {
    const message = commentId 
      ? `ID가 '${commentId}'인 댓글은 비공개입니다.`
      : '비공개 댓글입니다.';
    
    super(ErrorCode.COMMENT_IS_PRIVATE, message, {
      commentId,
      ...details,
    });
  }
}
