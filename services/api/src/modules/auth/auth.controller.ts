import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
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
import { RefreshTokenDto } from './dto/refresh.dto';
import { parseDurationToMs } from './services/refresh-tokens.service';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password.dto';
import { UpdateMeDto } from './dto/me.dto';
import { OAuthProfile } from './strategies/auth-strategy.interface';
import { GOOGLE_PROVIDER } from './strategies/google.strategy';
import { Public } from './guards/public.decorator';
import type { AuthenticatedRequest } from './guards/auth.guard';
import {
  CLIENT_PLATFORM_HEADER,
  isNativeClient,
  NATIVE_CLIENT_PLATFORM,
} from './client-platform';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@ApiBearerAuth()
@ApiHeader({
  name: CLIENT_PLATFORM_HEADER,
  description: `Envía "${NATIVE_CLIENT_PLATFORM}" desde la app móvil para recibir y enviar el refresh token en el body.`,
  required: false,
})
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfig,
  ) {}

  private refreshCookieOptions(): CookieOptions {
    const isProd = this.config.nodeEnv === 'production';
    return {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
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
    const isProd = this.config.nodeEnv === 'production';
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/auth',
    });
  }

  private readRefreshToken(
    req: ExpressRequest,
    body?: RefreshTokenDto,
  ): string | undefined {
    const cookie = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];
    if (isNativeClient(req)) return body?.refreshToken ?? cookie;
    return cookie;
  }

  private refreshTokenFromRequest(
    req: ExpressRequest,
    body?: RefreshTokenDto,
  ): string {
    const token = this.readRefreshToken(req, body);
    if (!token) throw new UnauthorizedException('Missing refresh token');
    return token;
  }

  private sessionResponse<T extends { refreshToken: string }>(
    req: ExpressRequest,
    session: T,
  ) {
    if (isNativeClient(req)) return session;
    const { refreshToken: _refreshToken, ...rest } = session;
    return rest;
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.me(req.user.userId);
  }

  @Patch('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(req.user.userId, dto);
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.verifyEmail(dto.token);
    this.setRefreshCookie(res, session.refreshToken);
    return this.sessionResponse(req, session);
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(res, session.refreshToken);
    return this.sessionResponse(req, session);
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Req() req: ExpressRequest,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.refreshTokenFromRequest(req, body);
    const session = await this.authService.refresh(token);
    this.setRefreshCookie(res, session.refreshToken);
    return this.sessionResponse(req, session);
  }

  @Post('logout')
  async logout(
    @Req() req: ExpressRequest,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.readRefreshToken(req, body);
    if (token) await this.authService.logout(token);
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message:
        'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Get('google')
  @UseGuards(PassportProtector(GOOGLE_PROVIDER))
  google() {}

  @Public()
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
        `${frontendUrl}/auth/callback?token=${encodeURIComponent(session.accessToken)}`,
      );
    }
    const { refreshToken: _refreshToken, ...rest } = session;
    return rest;
  }
}
