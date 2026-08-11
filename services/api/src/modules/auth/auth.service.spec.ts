import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { AUTH_STRATEGIES } from './strategies/auth-strategy.interface';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        { provide: TenantsService, useValue: {} },
        { provide: AUTH_STRATEGIES, useValue: [] },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
