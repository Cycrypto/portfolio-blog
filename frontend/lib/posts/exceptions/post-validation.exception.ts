import { BadRequestException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 포스트 데이터 검증 실패 시 발생하는 예외
 */
export class PostValidationException extends BadRequestException {
  constructor(field: string, value?: any, details?: any) {
    let message: string;
    let code: ErrorCode;

    switch (field) {
      case 'title':
        message = '포스트 제목은 필수입니다.';
        code = ErrorCode.POST_TITLE_REQUIRED;
        break;
      case 'category':
        message = '포스트 카테고리는 필수입니다.';
        code = ErrorCode.POST_CATEGORY_REQUIRED;
        break;
      case 'status':
        message = '유효하지 않은 포스트 상태입니다.';
        code = ErrorCode.POST_INVALID_STATUS;
        break;
      default:
        message = `포스트 ${field} 필드가 올바르지 않습니다.`;
        code = ErrorCode.VALIDATION_ERROR;
    }

    super(code, message, {
      field,
      value,
      ...details,
    });
  }
}
