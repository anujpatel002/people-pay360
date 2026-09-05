import { evaluateFormula } from '../services/payroll.service';
import { describe, it, expect } from '@jest/globals';
describe('payroll formula evaluator', () => {
  it('evaluates only configured variables and arithmetic', () => {
    expect(evaluateFormula('contract.wage * 0.4 + inputs.BONUS', {'contract.wage': 50000, 'inputs.BONUS': 1000})).toBe(21000);
  });
  it('rejects arbitrary execution and unknown values', () => {
    expect(() => evaluateFormula('process.exit(1)', {})).toThrow('unsupported variable');
    expect(() => evaluateFormula('rules.MISSING + 1', {})).toThrow('unsupported variable');
  });
});
