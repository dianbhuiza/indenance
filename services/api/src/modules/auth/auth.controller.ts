import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard as PassportProtector } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type {
  CookieOptions,
  Request as ExpressRequest,
  Response,
} from 'express';
import { AppConfig } from '../../config/app.config';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/register.dto';
import { parseDurationToMs } from './services/refresh-tokens.service';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password.dto';
import { OAuthProfile } from './strategies/auth-strategy.interface';
import { GOOGLE_PROVIDER } from './strategies/google.strategy';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfig,
  ) {}

  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.nodeEnv === 'production',
      path: '/auth',
      maxAge: parseDurationToMs(
        this.config.jwtRefreshExpiresIn,
        DEFAULT_REFRESH_TTL_MS,
      ),
    };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, this.refreshCookieOptions());
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      path: '/auth',
    });
  }

  private refreshTokenFromRequest(req: ExpressRequest): string {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];
    if (!token) throw new UnauthorizedException('Missing refresh token');
    return token;
  }

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.verifyEmail(dto.token);
    this.setRefreshCookie(res, session.refreshToken);
    const { refreshToken: _refreshToken, ...rest } = session;
    return rest;
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(res, session.refreshToken);
    const { refreshToken: _refreshToken, ...rest } = session;
    return rest;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.refreshTokenFromRequest(req);
    const session = await this.authService.refresh(token);
    this.setRefreshCookie(res, session.refreshToken);
    const { refreshToken: _refreshToken, ...rest } = session;
    return rest;
  }

  @Post('logout')
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];
    if (token) await this.authService.logout(token);
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message:
        'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('google')
  @UseGuards(PassportProtector(GOOGLE_PROVIDER))
  google() {}

  @Get('google/callback')
  @UseGuards(PassportProtector(GOOGLE_PROVIDER))
  async googleCallback(
    @Req() req: { user: OAuthProfile },
    @Res() res: Response,
  ) {
    const session = await this.authService.oauthLogin(req.user);
    this.setRefreshCookie(res, session.refreshToken);

    const frontendUrl = this.config.frontendUrl;
    if (frontendUrl) {
      return res.redirect(
        `${frontendUrl}/auth/callback#token=${session.accessToken}`,
      );
    }
    const { refreshToken: _refreshToken, ...rest } = session;
    return rest;
  }
}
