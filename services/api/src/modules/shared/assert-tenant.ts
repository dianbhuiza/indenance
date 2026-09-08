import { ForbiddenException } from '@nestjs/common';

export function assertTenant(
  tenantId: string | null,
): asserts tenantId is string {
  if (!tenantId)
    throw new ForbiddenException('User does not belong to a tenant');
}
