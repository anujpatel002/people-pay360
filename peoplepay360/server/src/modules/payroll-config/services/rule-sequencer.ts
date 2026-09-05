import { findByStructure } from '../repositories/salary-rule.repository';

export interface SequencedRule {
  id: string; code: string; name: string; category: string;
  sequence: number; computationMethod: string;
  amount: number | null; percentage: number | null; formula: string | null;
}

/**
 * Returns active rules for a structure sorted ascending by sequence.
 * Tie-break: alphabetical by code (deterministic).
 * Only export consumed by the payroll module.
 */
export async function getSequencedRules(structureId: string): Promise<SequencedRule[]> {
  const rows = await findByStructure(structureId);
  return rows
    .filter((r) => Boolean(r.is_active))
    .sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code))
    .map((r) => ({
      id: r.id, code: r.code, name: r.name, category: r.category,
      sequence: r.sequence, computationMethod: r.computation_method,
      amount: r.amount !== null ? Number(r.amount) : null,
      percentage: r.percentage !== null ? Number(r.percentage) : null,
      formula: r.formula,
    }));
}

/**
 * Detects circular dependencies in formula rules.
 * A circular dependency exists when rule A's formula references rule B,
 * and rule B's formula references rule A (direct or transitive).
 */
export function detectCircularDependency(
  rules: { code: string; formula: string | null }[]
): string | null {
  const graph = new Map<string, Set<string>>();

  for (const rule of rules) {
    const deps = new Set<string>();
    if (rule.formula) {
      for (const r of rules) {
        if (r.code !== rule.code && rule.formula.includes(r.code)) {
          deps.add(r.code);
        }
      }
    }
    graph.set(rule.code, deps);
  }

  function hasCycle(node: string, visited: Set<string>, stack: Set<string>): boolean {
    visited.add(node);
    stack.add(node);
    for (const dep of graph.get(node) ?? []) {
      if (!visited.has(dep) && hasCycle(dep, visited, stack)) return true;
      if (stack.has(dep)) return true;
    }
    stack.delete(node);
    return false;
  }

  const visited = new Set<string>();
  for (const code of graph.keys()) {
    if (!visited.has(code) && hasCycle(code, visited, new Set())) {
      return code;
    }
  }
  return null;
}
