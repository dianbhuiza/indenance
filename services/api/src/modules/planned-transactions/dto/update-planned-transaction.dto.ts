import { PartialType } from '@nestjs/swagger';
import { CreatePlannedTransactionDto } from './create-planned-transaction.dto';

export class UpdatePlannedTransactionDto extends PartialType(
  CreatePlannedTransactionDto,
) {}
