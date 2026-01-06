import { NotFoundException } from '../../common/exceptions';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';

/**
 * 포스트를 찾을 수 없을 때 발생하는 예외
 */
export class PostNotFoundException extends NotFoundException {
  constructor(postId?: string | number, details?: any) {
    const message = postId 
      ? `ID가 '${postId}'인 포스트를 찾을 수 없습니다.`
      : '포스트를 찾을 수 없습니다.';
    
    super(ErrorCode.POST_NOT_FOUND, message, {
      postId,
      ...details,
    });
  }
}
