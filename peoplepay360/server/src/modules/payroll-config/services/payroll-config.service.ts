import * as structureRepo from '../repositories/salary-structure.repository';
import * as ruleRepo from '../repositories/salary-rule.repository';
import { detectCircularDependency } from './rule-sequencer';
import { CreateStructureInput, UpdateStructureInput, CreateRuleInput, UpdateRuleInput } from '../validators/payroll-config.validator';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError';

// ─── DTOs ────────────────────────────────────────────────────────────────────

function toStructureDTO(row: structureRepo.StructureRow) {
  return {
    id: row.id, name: row.name, isActive: Boolean(row.is_active),
    ruleCount: Number(row.rule_count ?? 0),
    employeeCount: Number(row.employee_count ?? 0),
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function toRuleDTO(row: ruleRepo.RuleRow) {
  return {
    id: row.id, structureId: row.structure_id, code: row.code,
    name: row.name, category: row.category, sequence: row.sequence,
    computationMethod: row.computation_method,
    amount: row.amount !== null ? Number(row.amount) : null,
    percentage: row.percentage !== null ? Number(row.percentage) : null,
    formula: row.formula, isActive: Boolean(row.is_active),
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// ─── Structures ──────────────────────────────────────────────────────────────

export async function getStructures(filters: { search?: string; isActive?: boolean }) {
  const rows = await structureRepo.findAll(filters);
  return { data: rows.map(toStructureDTO), total: rows.length };
}

export async function getStructure(id: string) {
  const row = await structureRepo.findById(id);
  if (!row) throw new NotFoundError('Salary structure not found');
  const rules = await ruleRepo.findByStructure(id);
  return { ...toStructureDTO(row), rules: rules.map(toRuleDTO) };
}

export async function createStructure(input: CreateStructureInput) {
  const existing = await structureRepo.findByName(input.name);
  if (existing) throw new ValidationError('A structure with this name already exists');
  const id = await structureRepo.create({ name: input.name, isActive: input.isActive ?? true });
  const row = await structureRepo.findById(id);
  return toStructureDTO(row!);
}

export async function updateStructure(id: string, input: UpdateStructureInput) {
  const existing = await structureRepo.findById(id);
  if (!existing) throw new NotFoundError('Salary structure not found');
  if (input.name && input.name !== existing.name) {
    const dup = await structureRepo.findByName(input.name);
    if (dup) throw new ValidationError('A structure with this name already exists');
  }
  await structureRepo.update(id, { name: input.name, isActive: input.isActive });
  const updated = await structureRepo.findById(id);
  return toStructureDTO(updated!);
}

export async function deleteStructure(id: string) {
  if (!await structureRepo.findById(id)) throw new NotFoundError('Salary structure not found');
  if (await structureRepo.isReferencedByContract(id))
    throw new ValidationError('Structure is referenced by one or more active contracts');
  await structureRepo.remove(id);
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export async function getRules(structureId: string) {
  if (structureId && !await structureRepo.findById(structureId))
    throw new NotFoundError('Salary structure not found');
  const rows = await ruleRepo.findByStructure(structureId);
  return { data: rows.map(toRuleDTO), total: rows.length };
}

export async function createRule(input: CreateRuleInput) {
  if (!await structureRepo.findById(input.structureId))
    throw new NotFoundError('Salary structure not found');

  const dup = await ruleRepo.findByCode(input.structureId, input.code);
  if (dup) throw new ValidationError(`Rule code ${input.code} already exists in this structure`);

  // Circular dependency check
  const existingRules = await ruleRepo.findByStructure(input.structureId);
  const allRules = [...existingRules.map((r) => ({ code: r.code, formula: r.formula })),
                    { code: input.code, formula: input.formula ?? null }];
  const cycle = detectCircularDependency(allRules);
  if (cycle) throw new ValidationError(`Circular dependency detected involving rule: ${cycle}`);

  const id = await ruleRepo.create({
    structureId: input.structureId, code: input.code, name: input.name,
    category: input.category, sequence: input.sequence,
    computationMethod: input.computationMethod,
    amount: input.amount ?? null, percentage: input.percentage ?? null,
    formula: input.formula ?? null, isActive: input.isActive ?? true,
  });
  return toRuleDTO((await ruleRepo.findById(id))!);
}

export async function updateRule(id: string, input: UpdateRuleInput) {
  const existing = await ruleRepo.findById(id);
  if (!existing) throw new NotFoundError('Salary rule not found');

  // Circular dependency check if formula is being updated
  if (input.formula !== undefined) {
    const allRules = await ruleRepo.findByStructure(existing.structure_id);
    const merged = allRules.map((r) => ({
      code: r.code,
      formula: r.id === id ? (input.formula ?? null) : r.formula,
    }));
    const cycle = detectCircularDependency(merged);
    if (cycle) throw new ValidationError(`Circular dependency detected involving rule: ${cycle}`);
  }

  await ruleRepo.update(id, input as Record<string, unknown>);
  return toRuleDTO((await ruleRepo.findById(id))!);
}

export async function deleteRule(id: string) {
  if (!await ruleRepo.findById(id)) throw new NotFoundError('Salary rule not found');
  await ruleRepo.remove(id);
}
