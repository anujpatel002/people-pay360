import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as savedViewService from '../services/dashboard-saved-view.service';
import * as savedViewRepo from '../repositories/dashboard-saved-view.repository';
import { AppError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';

jest.mock('../repositories/dashboard-saved-view.repository');

describe('dashboard-saved-view.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates saved view with valid user scope', async () => {
    (savedViewRepo.findByNameAndUserId as jest.MockedFunction<typeof savedViewRepo.findByNameAndUserId>).mockResolvedValue(null);
    (savedViewRepo.create as jest.MockedFunction<typeof savedViewRepo.create>).mockResolvedValue({
      id: 'view_001',
      userId: 'user_123',
      name: 'Engineering Full-Time',
      period: '2024-03',
      companyId: 'cmp_001',
      departmentId: 'dep_eng',
      employmentType: 'et_ft',
      isDefault: false,
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    });

    const result = await savedViewService.createSavedView('user_123', {
      name: 'Engineering Full-Time',
      period: '2024-03',
      companyId: 'cmp_001',
      departmentId: 'dep_eng',
      employmentType: 'et_ft',
    });

    expect(result.id).toBe('view_001');
    expect(result.name).toBe('Engineering Full-Time');
    expect(savedViewRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_123',
        name: 'Engineering Full-Time',
      })
    );
  });

  it('rejects duplicate view names for the same user with 409 Conflict', async () => {
    (savedViewRepo.findByNameAndUserId as jest.MockedFunction<typeof savedViewRepo.findByNameAndUserId>).mockResolvedValue({
      id: 'existing_view',
      userId: 'user_123',
      name: 'Existing Name',
      isDefault: false,
      createdAt: '',
      updatedAt: '',
    });

    await expect(
      savedViewService.createSavedView('user_123', { name: 'Existing Name' })
    ).rejects.toThrow(AppError);
  });

  it('enforces IDOR isolation: throws NotFoundError when accessing another user’s view', async () => {
    (savedViewRepo.findByIdAndUserId as jest.MockedFunction<typeof savedViewRepo.findByIdAndUserId>).mockResolvedValue(null);

    await expect(
      savedViewService.getSavedViewById('view_of_another_user', 'user_123')
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects empty view name with ValidationError', async () => {
    await expect(
      savedViewService.createSavedView('user_123', { name: '   ' })
    ).rejects.toThrow(ValidationError);
  });
});
