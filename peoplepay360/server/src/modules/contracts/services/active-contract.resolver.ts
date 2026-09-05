import * as repo from '../repositories/contracts.repository';
import { Contract } from '../models/contract.types';
import { NotFoundError, AppError } from '../../../shared/errors/AppError';

export async function resolveActiveContract(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<Contract> {
  const matches = await repo.findActiveForPeriod(employeeId, periodStart, periodEnd);

  if (matches.length === 0) {
    throw new NotFoundError('No active contract found for the given period');
  }

  if (matches.length > 1) {
    throw new AppError(409, 'Multiple overlapping contracts found for the given period');
  }

  return matches[0];
}
