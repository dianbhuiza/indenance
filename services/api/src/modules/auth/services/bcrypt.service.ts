import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const MAX_PASSWORD_BYTES = 72;

@Injectable()
export class BcryptService {
  async hash(password: string): Promise<string> {
    if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
      throw new BadRequestException(
        `Password must not exceed ${MAX_PASSWORD_BYTES} bytes`,
      );
    }
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
