import { ConflictException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 이미 존재하는 포스트를 생성하려고 할 때 발생하는 예외
 */
export class PostAlreadyExistsException extends ConflictException {
  constructor(title?: string, slug?: string, details?: any) {
    const message = title 
      ? `'${title}' 제목의 포스트가 이미 존재합니다.`
      : '이미 존재하는 포스트입니다.';
    
    super(ErrorCode.POST_ALREADY_EXISTS, message, {
      title,
      slug,
      ...details,
    });
  }
}
