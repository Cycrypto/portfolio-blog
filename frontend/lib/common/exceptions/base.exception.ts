import { ErrorCode, ERROR_MESSAGES } from './error-codes.enum';

/**
 * 모든 커스텀 예외의 기본 클래스
 * 일관된 에러 처리와 로깅을 위한 공통 인터페이스를 제공합니다.
 */
export abstract class BaseException extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode: number = 500,
    details?: any
  ) {
    // 메시지가 제공되지 않으면 에러 코드에 해당하는 기본 메시지 사용
    const errorMessage = message || ERROR_MESSAGES[code] || '알 수 없는 오류가 발생했습니다.';
    
    super(errorMessage);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.details = details;

    // 스택 트레이스 유지
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 에러 정보를 JSON 형태로 직렬화
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      details: this.details,
    };
  }

  /**
   * 에러 정보를 로깅용 문자열로 변환
   */
  toString(): string {
    return `[${this.name}] ${this.code}: ${this.message} (${this.statusCode})`;
  }
}

/**
 * HTTP 상태 코드별 기본 예외 클래스들
 */
export class BadRequestException extends BaseException {
  constructor(code: ErrorCode, message?: string, details?: any) {
    super(code, message, 400, details);
  }
}

export class UnauthorizedException extends BaseException {
  constructor(code: ErrorCode, message?: string, details?: any) {
    super(code, message, 401, details);
  }
}

export class ForbiddenException extends BaseException {
  constructor(code: ErrorCode, message?: string, details?: any) {
    super(code, message, 403, details);
  }
}

export class NotFoundException extends BaseException {
  constructor(code: ErrorCode, message?: string, details?: any) {
    super(code, message, 404, details);
  }
}

export class ConflictException extends BaseException {
  constructor(code: ErrorCode, message?: string, details?: any) {
    super(code, message, 409, details);
  }
}

export class InternalServerException extends BaseException {
  constructor(code: ErrorCode, message?: string, details?: any) {
    super(code, message, 500, details);
  }
}
