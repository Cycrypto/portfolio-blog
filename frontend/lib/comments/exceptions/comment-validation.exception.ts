import { BadRequestException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 댓글 데이터 검증 실패 시 발생하는 예외
 */
export class CommentValidationException extends BadRequestException {
  constructor(field: string, value?: any, details?: any) {
    let message: string;
    let code: ErrorCode;

    switch (field) {
      case 'content':
        message = '댓글 내용은 필수입니다.';
        code = ErrorCode.COMMENT_CONTENT_REQUIRED;
        break;
      case 'authorName':
        message = '댓글 작성자는 필수입니다.';
        code = ErrorCode.COMMENT_AUTHOR_REQUIRED;
        break;
      case 'authorEmail':
        message = '댓글 작성자 이메일은 필수입니다.';
        code = ErrorCode.COMMENT_EMAIL_REQUIRED;
        break;
      default:
        message = `댓글 ${field} 필드가 올바르지 않습니다.`;
        code = ErrorCode.VALIDATION_ERROR;
    }

    super(code, message, {
      field,
      value,
      ...details,
    });
  }
}
