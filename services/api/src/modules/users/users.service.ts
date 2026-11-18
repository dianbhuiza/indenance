import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  isRecordNotFoundError,
  isUniqueConstraintError,
} from '../prisma/prisma-errors';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictException('Email already registered');
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(
    id: string,
    data: Prisma.UserUncheckedUpdateInput,
  ): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (isRecordNotFoundError(error))
        throw new NotFoundException(`User with id ${id} not found`);
      throw error;
    }
  }

  async updateAsAdmin(
    actorId: string,
    id: string,
    dto: { name?: string; phone?: string; role?: 'USER' | 'ADMIN' },
  ): Promise<User> {
    const data: Prisma.UserUncheckedUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.role !== undefined && { role: dto.role }),
    };

    if (
      dto.role !== undefined &&
      dto.role !== 'ADMIN' &&
      actorId === id &&
      (await this.countAdmins()) <= 1
    ) {
      throw new ForbiddenException('Cannot demote the last admin');
    }

    return this.update(id, data);
  }

  async verifyEmail(id: string): Promise<User> {
    return this.update(id, { emailVerifiedAt: new Date() });
  }

  private async countAdmins(): Promise<number> {
    return this.prisma.user.count({ where: { role: 'ADMIN' } });
  }

  async remove(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFoundError(error))
        throw new NotFoundException(`User with id ${id} not found`);
      throw error;
    }
  }
}
