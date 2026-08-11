import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import {
  AUTH_STRATEGIES,
  AuthStrategy,
} from './strategies/auth-strategy.interface';
import { CREDENTIALS_PROVIDER } from './strategies/credentials.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    @Inject(AUTH_STRATEGIES) private readonly strategies: AuthStrategy[],
  ) {}

  private getStrategy(provider: string): AuthStrategy {
    const strategy = this.strategies.find((s) => s.provider === provider);
    if (!strategy)
      throw new UnauthorizedException(`Unsupported auth provider: ${provider}`);
    return strategy;
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
    });

    const tenant = await this.tenantsService.createForUser(user.id, {
      name: dto.name ? `${dto.name}'s home` : 'Mi hogar',
    });

    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);
    const authMethod = await strategy.create({
      userId: user.id,
      providerAccountId: dto.email,
      password: dto.password,
    });

    return { user, tenant, authMethod };
  }

  async login(dto: LoginDto) {
    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);
    const result = await strategy.validate({
      email: dto.email,
      password: dto.password,
    });
    if (!result) throw new UnauthorizedException('Invalid credentials');

    const user = await this.usersService.findOne(result.userId);
    return { user };
  }
}
