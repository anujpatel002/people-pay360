export type RuleCategory        = 'Basic' | 'Allowance' | 'Gross' | 'Deduction' | 'Net' | 'Other';
export type ComputationMethod   = 'fixed_amount' | 'percentage_of_gross' | 'formula';

export interface SalaryStructure {
  id: string; name: string; isActive: boolean;
  ruleCount: number; employeeCount: number;
  createdAt: string; updatedAt: string;
}

export interface SalaryStructureDetail extends SalaryStructure {
  rules: SalaryRule[];
}

export interface SalaryRule {
  id: string; structureId: string; code: string; name: string;
  category: RuleCategory; sequence: number;
  computationMethod: ComputationMethod;
  amount: number | null; percentage: number | null; formula: string | null;
  isActive: boolean; createdAt: string; updatedAt: string;
}

export interface StructureFormValues { name: string; isActive: boolean; }

export interface RuleFormValues {
  structureId: string; code: string; name: string;
  category: RuleCategory; sequence: number;
  computationMethod: ComputationMethod;
  amount: number | null; percentage: number | null; formula: string | null;
  isActive: boolean;
}

export const CATEGORIES: RuleCategory[]      = ['Basic', 'Allowance', 'Gross', 'Deduction', 'Net', 'Other'];
export const COMPUTATION_METHODS: { value: ComputationMethod; label: string }[] = [
  { value: 'fixed_amount',        label: 'Fixed Amount' },
  { value: 'percentage_of_gross', label: 'Percentage of Gross' },
  { value: 'formula',             label: 'Formula' },
];

export const CATEGORY_COLORS: Record<RuleCategory, string> = {
  Basic:     '#dbeafe', Allowance: '#dcfce7', Gross:     '#fef9c3',
  Deduction: '#fee2e2', Net:       '#f3e8ff', Other:     '#f3f4f6',
};
