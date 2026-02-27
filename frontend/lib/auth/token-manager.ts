/**
 * 토큰 관리 유틸리티
 * JWT 토큰의 저장, 조회, 삭제를 안전하게 처리합니다.
 */

const TOKEN_KEY = 'auth_token';
const LEGACY_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_CHANGE_EVENT = 'auth-token-changed';

export class TokenManager {
  private static emitTokenChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(TOKEN_CHANGE_EVENT));
    }
  }

  /**
   * 토큰을 로컬 스토리지에 저장
   */
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      this.emitTokenChange();
    }
  }

  /**
   * 리프레시 토큰을 로컬 스토리지에 저장
   */
  static setRefreshToken(refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      this.emitTokenChange();
    }
  }

  /**
   * 저장된 토큰을 조회
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (currentToken) {
        return currentToken;
      }

      // 레거시 키("token")를 사용하는 세션을 자동 마이그레이션
      const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
      if (legacyToken) {
        localStorage.setItem(TOKEN_KEY, legacyToken);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
      }
      return legacyToken;
    }
    return null;
  }

  /**
   * 저장된 리프레시 토큰을 조회
   */
  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * 토큰을 삭제
   */
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      this.emitTokenChange();
    }
  }

  /**
   * 리프레시 토큰을 삭제
   */
  static removeRefreshToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      this.emitTokenChange();
    }
  }

  /**
   * 모든 토큰을 삭제
   */
  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      this.emitTokenChange();
    }
  }

  /**
   * 하위 호환용: clearTokens로 위임
   */
  static clearToken(): void {
    this.clearTokens();
  }

  /**
   * 토큰이 유효한지 확인 (만료 시간 체크)
   */
  static isTokenValid(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return false;

    try {
      // JWT 토큰 디코딩 (payload 부분만)
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // exp (expiration time) 필드가 있고, 현재 시간보다 미래인지 확인
      return payload.exp && payload.exp > currentTime;
    } catch (error) {
      console.error('토큰 검증 중 오류:', error);
      return false;
    }
  }

  /**
   * 토큰의 만료 시간을 반환
   */
  static getTokenExpiration(token?: string): Date | null {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return null;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('토큰 만료 시간 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * Authorization 헤더 값을 반환
   */
  static getAuthorizationHeader(): string | null {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }
}
