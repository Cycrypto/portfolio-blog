import { InternalServerException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 포스트 생성 실패 시 발생하는 예외
 */
export class PostCreateException extends InternalServerException {
  constructor(originalError?: Error, details?: any) {
    super(ErrorCode.POST_CREATE_FAILED, '포스트 생성에 실패했습니다.', {
      originalError: originalError?.message,
      ...details,
    });
  }
}

/**
 * 포스트 수정 실패 시 발생하는 예외
 */
export class PostUpdateException extends InternalServerException {
  constructor(postId: string | number, originalError?: Error, details?: any) {
    super(ErrorCode.POST_UPDATE_FAILED, '포스트 수정에 실패했습니다.', {
      postId,
      originalError: originalError?.message,
      ...details,
    });
  }
}

/**
 * 포스트 삭제 실패 시 발생하는 예외
 */
export class PostDeleteException extends InternalServerException {
  constructor(postId: string | number, originalError?: Error, details?: any) {
    super(ErrorCode.POST_DELETE_FAILED, '포스트 삭제에 실패했습니다.', {
      postId,
      originalError: originalError?.message,
      ...details,
    });
  }
}
