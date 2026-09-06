import { z } from 'zod';

const CATEGORIES         = ['Basic', 'Allowance', 'Gross', 'Deduction', 'Net', 'Other'] as const;
const COMPUTATION_METHODS = ['fixed_amount', 'percentage_of_gross', 'formula'] as const;

export const createStructureSchema = z.object({
  name:     z.string().min(1, 'name is required'),
  isActive: z.boolean().default(true),
});

export const updateStructureSchema = createStructureSchema.partial();

const ruleBaseSchema = z.object({
  structureId:       z.string().min(1, 'structureId is required'),
  code:              z.string().min(1, 'code is required').toUpperCase(),
  name:              z.string().min(1, 'name is required'),
  category:          z.enum(CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),
  sequence:          z.number().int().min(1, 'sequence must be >= 1'),
  computationMethod: z.enum(COMPUTATION_METHODS, { errorMap: () => ({ message: 'Invalid computationMethod' }) }),
  amount:            z.number().min(0).nullable().optional(),
  percentage:        z.number().min(0).max(100).nullable().optional(),
  formula:           z.string().nullable().optional(),
  isActive:          z.boolean().default(true),
});

const ruleValueRefine = (d: z.infer<typeof ruleBaseSchema>) => {
  if (d.computationMethod === 'fixed_amount')        return d.amount != null;
  if (d.computationMethod === 'percentage_of_gross') return d.percentage != null;
  if (d.computationMethod === 'formula')             return d.formula != null && d.formula.trim().length > 0;
  return true;
};

export const createRuleSchema = ruleBaseSchema.refine(ruleValueRefine, {
  message: 'Provide amount, percentage, or formula matching the computationMethod',
});

export const updateRuleSchema = ruleBaseSchema.omit({ structureId: true }).partial();

export type CreateStructureInput = z.infer<typeof createStructureSchema>;
export type UpdateStructureInput = z.infer<typeof updateStructureSchema>;
export type CreateRuleInput      = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput      = z.infer<typeof updateRuleSchema>;
