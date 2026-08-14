import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: { userId: string; provider: string; tenantId: string | null };
}

export interface JwtPayload {
  sub: string;
  provider: string;
  tenantId?: string | null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.resolveToken(request);
    if (!token) throw new UnauthorizedException('Missing auth token');

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid auth token');
    }

    request.user = {
      userId: payload.sub,
      provider: payload.provider,
      tenantId: payload.tenantId ?? null,
    };
    return true;
  }

  private resolveToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return null;
    return header.slice('Bearer '.length);
  }
}
