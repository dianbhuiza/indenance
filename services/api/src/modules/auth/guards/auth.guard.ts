import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AUTH_STRATEGIES,
  AuthStrategy,
} from '../strategies/auth-strategy.interface';
import { CREDENTIALS_PROVIDER } from '../strategies/credentials.strategy';

const DEFAULT_PROVIDER = CREDENTIALS_PROVIDER;

export interface AuthenticatedRequest extends Request {
  user: { userId: string; provider: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_STRATEGIES) private readonly strategies: AuthStrategy[],
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const provider = this.resolveProvider(request);
    const strategy = this.strategies.find((s) => s.provider === provider);
    if (!strategy)
      throw new UnauthorizedException(`Unsupported auth provider: ${provider}`);

    const input = this.resolveCredentials(request);
    if (!input) throw new UnauthorizedException('Missing credentials');

    const result = await strategy.validate(input);
    if (!result) throw new UnauthorizedException('Invalid credentials');

    request.user = {
      userId: result.userId,
      provider: result.provider,
    };
    return true;
  }

  private resolveProvider(request: Request): string {
    const header = request.headers['x-auth-provider'];
    if (Array.isArray(header)) return header[0] || DEFAULT_PROVIDER;
    return header || DEFAULT_PROVIDER;
  }

  private resolveCredentials(
    request: Request,
  ): { email: string; password: string } | null {
    const authorization = request.headers.authorization;
    if (!authorization || !authorization.startsWith('Basic ')) return null;

    try {
      const decoded = Buffer.from(
        authorization.slice('Basic '.length),
        'base64',
      ).toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator === -1) return null;
      return {
        email: decoded.slice(0, separator),
        password: decoded.slice(separator + 1),
      };
    } catch {
      return null;
    }
  }
}
