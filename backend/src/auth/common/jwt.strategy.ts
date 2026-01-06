
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'dev-secret-key', // Must match the secret in AuthModule
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy validate called with payload:', payload);
    // The object returned here will be attached to the request as request.user
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
