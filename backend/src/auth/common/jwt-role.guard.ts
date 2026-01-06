import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class JwtRoleGuard extends JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      console.log('JwtRoleGuard: Starting authentication check');
      
      // 먼저 JWT 인증을 확인
      const isAuthenticated = await super.canActivate(context);
      console.log('JwtRoleGuard: JWT authentication result:', isAuthenticated);
      
      if (!isAuthenticated) {
        console.log('JwtRoleGuard: JWT authentication failed');
        return false;
      }

      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);

      console.log('JwtRoleGuard: Required roles:', requiredRoles);

      if (!requiredRoles) {
        console.log('JwtRoleGuard: No roles required, allowing access');
        return true; // No roles required, allow access
      }

      const { user } = context.switchToHttp().getRequest();
      console.log('JwtRoleGuard: User from request:', user);
      
      if (!user || !user.roles) {
        console.log('JwtRoleGuard: User or user.roles is not defined');
        return false; // User or user.roles is not defined
      }

      const hasRole = requiredRoles.some((role) => user.roles.includes(role));
      console.log('JwtRoleGuard: User has required role:', hasRole);
      
      return hasRole;
    } catch (e) {
      console.error('JwtRoleGuard: Error during authentication:', e?.message);
      throw e;
    }
  }
}
