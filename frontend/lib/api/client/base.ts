import { TokenManager } from '../../auth/token-manager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface CommonResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean; // 인증이 필요한 요청인지 여부
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { requireAuth = true, ...requestOptions } = options;
  
  // 기본 헤더 설정
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...requestOptions.headers,
  };

  // 인증이 필요한 경우 토큰 추가
  if (requireAuth) {
    const authHeader = TokenManager.getAuthorizationHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
  }
  
  const config: RequestInit = {
    ...requestOptions,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // 401 Unauthorized 응답 처리
    if (response.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      TokenManager.clearTokens();
      throw new ApiError(
        '인증이 필요합니다. 다시 로그인해주세요.',
        401,
        await response.text()
      );
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error.message}`);
  }
}

export { API_BASE_URL };
