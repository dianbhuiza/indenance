import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from '../../config/app.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            verifyEmail: jest.fn(),
            login: jest.fn(),
            oauthLogin: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: AppConfig,
          useValue: {
            frontendUrl: undefined,
            nodeEnv: 'development',
            jwtRefreshExpiresIn: '7d',
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
