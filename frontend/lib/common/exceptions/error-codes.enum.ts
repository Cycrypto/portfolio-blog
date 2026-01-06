/**
 * 중앙화된 에러 코드 관리
 * 모든 도메인의 에러 코드를 한 곳에서 관리하여 중복을 방지하고 일관성을 유지합니다.
 */
export enum ErrorCode {
  // 공통 에러 (1000-1999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Post 도메인 에러 (2000-2999)
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  POST_ALREADY_EXISTS = 'POST_ALREADY_EXISTS',
  POST_TITLE_REQUIRED = 'POST_TITLE_REQUIRED',
  POST_CATEGORY_REQUIRED = 'POST_CATEGORY_REQUIRED',
  POST_INVALID_STATUS = 'POST_INVALID_STATUS',
  POST_UPDATE_FAILED = 'POST_UPDATE_FAILED',
  POST_DELETE_FAILED = 'POST_DELETE_FAILED',
  POST_CREATE_FAILED = 'POST_CREATE_FAILED',

  // Comment 도메인 에러 (3000-3999)
  COMMENT_NOT_FOUND = 'COMMENT_NOT_FOUND',
  COMMENT_IS_PRIVATE = 'COMMENT_IS_PRIVATE',
  COMMENT_CONTENT_REQUIRED = 'COMMENT_CONTENT_REQUIRED',
  COMMENT_AUTHOR_REQUIRED = 'COMMENT_AUTHOR_REQUIRED',
  COMMENT_EMAIL_REQUIRED = 'COMMENT_EMAIL_REQUIRED',
  COMMENT_UPDATE_FAILED = 'COMMENT_UPDATE_FAILED',
  COMMENT_DELETE_FAILED = 'COMMENT_DELETE_FAILED',
  COMMENT_CREATE_FAILED = 'COMMENT_CREATE_FAILED',

  // Profile 도메인 에러 (4000-4999)
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  PROFILE_INVALID_DATA = 'PROFILE_INVALID_DATA',

  // Project 도메인 에러 (5000-5999)
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  PROJECT_ALREADY_EXISTS = 'PROJECT_ALREADY_EXISTS',
  PROJECT_TITLE_REQUIRED = 'PROJECT_TITLE_REQUIRED',
  PROJECT_UPDATE_FAILED = 'PROJECT_UPDATE_FAILED',
  PROJECT_DELETE_FAILED = 'PROJECT_DELETE_FAILED',
  PROJECT_CREATE_FAILED = 'PROJECT_CREATE_FAILED',
}

/**
 * 에러 코드별 기본 메시지 매핑
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 공통 에러 메시지
  [ErrorCode.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다.',
  [ErrorCode.VALIDATION_ERROR]: '입력 데이터가 올바르지 않습니다.',
  [ErrorCode.UNAUTHORIZED]: '인증이 필요합니다.',
  [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.CONFLICT]: '리소스 충돌이 발생했습니다.',
  [ErrorCode.BAD_REQUEST]: '잘못된 요청입니다.',
  [ErrorCode.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
  [ErrorCode.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다.',

  // Post 도메인 에러 메시지
  [ErrorCode.POST_NOT_FOUND]: '포스트를 찾을 수 없습니다.',
  [ErrorCode.POST_ALREADY_EXISTS]: '이미 존재하는 포스트입니다.',
  [ErrorCode.POST_TITLE_REQUIRED]: '포스트 제목은 필수입니다.',
  [ErrorCode.POST_CATEGORY_REQUIRED]: '포스트 카테고리는 필수입니다.',
  [ErrorCode.POST_INVALID_STATUS]: '유효하지 않은 포스트 상태입니다.',
  [ErrorCode.POST_UPDATE_FAILED]: '포스트 수정에 실패했습니다.',
  [ErrorCode.POST_DELETE_FAILED]: '포스트 삭제에 실패했습니다.',
  [ErrorCode.POST_CREATE_FAILED]: '포스트 생성에 실패했습니다.',

  // Comment 도메인 에러 메시지
  [ErrorCode.COMMENT_NOT_FOUND]: '댓글을 찾을 수 없습니다.',
  [ErrorCode.COMMENT_IS_PRIVATE]: '비공개 댓글입니다.',
  [ErrorCode.COMMENT_CONTENT_REQUIRED]: '댓글 내용은 필수입니다.',
  [ErrorCode.COMMENT_AUTHOR_REQUIRED]: '댓글 작성자는 필수입니다.',
  [ErrorCode.COMMENT_EMAIL_REQUIRED]: '댓글 작성자 이메일은 필수입니다.',
  [ErrorCode.COMMENT_UPDATE_FAILED]: '댓글 수정에 실패했습니다.',
  [ErrorCode.COMMENT_DELETE_FAILED]: '댓글 삭제에 실패했습니다.',
  [ErrorCode.COMMENT_CREATE_FAILED]: '댓글 생성에 실패했습니다.',

  // Profile 도메인 에러 메시지
  [ErrorCode.PROFILE_NOT_FOUND]: '프로필을 찾을 수 없습니다.',
  [ErrorCode.PROFILE_UPDATE_FAILED]: '프로필 수정에 실패했습니다.',
  [ErrorCode.PROFILE_INVALID_DATA]: '프로필 데이터가 올바르지 않습니다.',

  // Project 도메인 에러 메시지
  [ErrorCode.PROJECT_NOT_FOUND]: '프로젝트를 찾을 수 없습니다.',
  [ErrorCode.PROJECT_ALREADY_EXISTS]: '이미 존재하는 프로젝트입니다.',
  [ErrorCode.PROJECT_TITLE_REQUIRED]: '프로젝트 제목은 필수입니다.',
  [ErrorCode.PROJECT_UPDATE_FAILED]: '프로젝트 수정에 실패했습니다.',
  [ErrorCode.PROJECT_DELETE_FAILED]: '프로젝트 삭제에 실패했습니다.',
  [ErrorCode.PROJECT_CREATE_FAILED]: '프로젝트 생성에 실패했습니다.',
};
