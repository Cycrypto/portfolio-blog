/**
 * Common Exceptions 배럴 파일
 * 모든 공통 예외 관련 클래스와 타입을 한 곳에서 export합니다.
 */

// Base Exception Classes
export {
  BaseException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerException,
} from './base.exception';

// Error Codes and Messages
export { ErrorCode, ERROR_MESSAGES } from './error-codes.enum';

// Error Handler Utilities
export {
  getErrorMessage,
  getErrorStatusCode,
  isErrorType,
  logError,
  formatErrorForUser,
} from './error-handler';
