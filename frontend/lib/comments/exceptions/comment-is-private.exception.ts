import { ForbiddenException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 댓글 접근 권한이 없을 때 발생하는 예외
 */
export class CommentIsPrivateException extends ForbiddenException {
  constructor(commentId?: string, message?: string, details?: any) {
    const resolvedMessage = message ?? (commentId
      ? `ID가 '${commentId}'인 댓글에 접근할 권한이 없습니다.`
      : '댓글에 접근할 권한이 없습니다.');
    super(ErrorCode.COMMENT_IS_PRIVATE, resolvedMessage, {
      commentId,
      ...details,
    });
  }
}
