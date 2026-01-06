import { BaseException } from './base.exception';
import { ApiError } from '../../api/client/base';

/**
 * 에러 처리 유틸리티 함수들
 * 클라이언트에서 일관된 에러 처리를 위한 헬퍼 함수들을 제공합니다.
 */

/**
 * 에러를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof BaseException) {
    return error.message;
  }
  
  if (error instanceof ApiError) {
    return `API 오류: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러의 HTTP 상태 코드를 반환
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof BaseException) {
    return error.statusCode;
  }
  
  if (error instanceof ApiError) {
    return error.status || 500;
  }
  
  return 500;
}

/**
 * 에러가 특정 타입인지 확인
 */
export function isErrorType<T extends BaseException>(
  error: unknown, 
  errorClass: new (...args: any[]) => T
): error is T {
  return error instanceof errorClass;
}

/**
 * 에러를 콘솔에 로깅 (개발 환경에서만)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error Handler] ${context ? `Context: ${context}` : ''}`);
    
    if (error instanceof BaseException) {
      console.error(`Type: ${error.constructor.name}`);
      console.error(`Code: ${error.code}`);
      console.error(`Message: ${error.message}`);
      console.error(`Status: ${error.statusCode}`);
      console.error(`Details:`, error.details);
      console.error(`Timestamp: ${error.timestamp}`);
    } else if (error instanceof ApiError) {
      console.error(`API Error: ${error.message}`);
      console.error(`Status: ${error.status}`);
      console.error(`Response:`, error.response);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/**
 * 에러를 사용자에게 표시할 수 있는 형태로 변환
 */
export function formatErrorForUser(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
  details?: any;
} {
  if (error instanceof BaseException) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    };
  }
  
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.status || 500,
    };
  }
  
  return {
    message: '알 수 없는 오류가 발생했습니다.',
    statusCode: 500,
  };
}
