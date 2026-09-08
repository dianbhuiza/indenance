import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isRecordNotFoundError, isUniqueConstraintError } from '../prisma/prisma-errors';

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
