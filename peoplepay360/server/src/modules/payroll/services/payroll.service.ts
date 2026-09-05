import pool from '../../../database/connection/pool';
import { AppError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { resolveActiveContract } from '../../contracts/services/active-contract.resolver';

type Actor = { id: string; employeeId: string; role: string };
const num = (v: unknown) => Number(v ?? 0);
const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

async function audit(entityType: string, entityId: string, action: string, actor: Actor, oldStatus?: string, newStatus?: string, metadata?: unknown) {
  await pool.execute(`INSERT INTO payroll_audit_logs (id,entity_type,entity_id,action,old_status,new_status,performed_by,metadata)
    VALUES (UUID(),?,?,?,?,?,?,?)`, [entityType, entityId, action, oldStatus ?? null, newStatus ?? null, actor.id, metadata ? JSON.stringify(metadata) : null] as any[]);
}

async function ensureVersion(structureId: string, actor: Actor) {
  const [versions] = await pool.execute<any[]>('SELECT * FROM salary_structure_versions WHERE structure_id=? AND status=? ORDER BY version DESC LIMIT 1', [structureId, 'Active']);
  if (versions[0]) return versions[0];
  const [structures] = await pool.execute<any[]>('SELECT * FROM salary_structures WHERE id=? AND is_active=1', [structureId]);
  if (!structures[0]) throw new ValidationError('Invalid or inactive Salary Structure');
  const id = crypto.randomUUID();
  await pool.execute('INSERT INTO salary_structure_versions (id,structure_id,version,status,created_by) VALUES (?,?,1,?,?)', [id, structureId, 'Active', actor.id]);
  const [rules] = await pool.execute<any[]>('SELECT * FROM salary_rules WHERE structure_id=? AND is_active=1 ORDER BY sequence,id', [structureId]);
  for (const rule of rules) await pool.execute(`INSERT INTO salary_rule_versions
    (id,structure_version_id,rule_code,rule_name,category,sequence,computation_method,amount,percentage,percentage_base_type,percentage_base_code,formula,is_active)
    VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?)`, [id, rule.code, rule.name, rule.category, rule.sequence, rule.computation_method, rule.amount, rule.percentage,
      rule.percentage_base_type ?? (rule.computation_method === 'percentage_of_gross' ? 'GROSS' : null), rule.percentage_base_code ?? null, rule.formula, rule.is_active] as any[]);
  return { id, structure_id: structureId, version: 1 };
}

/** Restricted arithmetic evaluator: only numeric operands and configured identifiers. */
export function evaluateFormula(expression: string, variables: Record<string, number>): number {
  const rendered = expression.replace(/[A-Za-z_][A-Za-z0-9_.]*/g, (token) => {
    if (!(token in variables)) throw new ValidationError(`Formula references unsupported variable: ${token}`);
    return String(variables[token]);
  });
  if (!/^[0-9+\-*/().\s]+$/.test(rendered) || rendered.length > 500) throw new ValidationError('Formula contains unsupported syntax');
  // A tiny recursive-descent grammar avoids eval/Function and deliberately has
  // no property access, calls, assignments, exponentiation, or statements.
  const tokens = rendered.match(/\d+(?:\.\d+)?|[()+\-*/]/g) ?? [];
  let cursor = 0;
  const factor = (): number => {
    const token = tokens[cursor++];
    if (token === '(') { const value = sum(); if (tokens[cursor++] !== ')') throw new ValidationError('Invalid formula grouping'); return value; }
    if (token === '+') return factor();
    if (token === '-') return -factor();
    if (!token || !/^\d/.test(token)) throw new ValidationError('Invalid formula');
    return Number(token);
  };
  const product = (): number => { let value = factor(); while (tokens[cursor] === '*' || tokens[cursor] === '/') { const op = tokens[cursor++]; const rhs = factor(); if (op === '/' && rhs === 0) throw new ValidationError('Formula division by zero'); value = op === '*' ? value * rhs : value / rhs; } return value; };
  const sum = (): number => { let value = product(); while (tokens[cursor] === '+' || tokens[cursor] === '-') { const op = tokens[cursor++]; const rhs = product(); value = op === '+' ? value + rhs : value - rhs; } return value; };
  const result = sum();
  if (cursor !== tokens.length) throw new ValidationError('Invalid formula');
  if (!Number.isFinite(result)) throw new ValidationError('Formula result is not finite');
  return Number(result);
}

async function loadRun(id: string) {
  const [rows] = await pool.execute<any[]>('SELECT * FROM payruns WHERE id=?', [id]);
  if (!rows[0]) throw new NotFoundError('Payrun not found');
  return rows[0];
}

export async function createPayrun(data: any, actor: Actor) {
  if (!Array.isArray(data.employeeIds) || !data.employeeIds.length) throw new ValidationError('Select at least one employee');
  if (data.periodEnd < data.periodStart) throw new ValidationError('Period end must be on or after period start');
  const version = await ensureVersion(data.structureId, actor);
  const id = crypto.randomUUID();
  await pool.execute(`INSERT INTO payruns (id,name,period_id,company_id,period_start,period_end,structure_id,structure_version_id,status,employee_count,currency_code)
    VALUES (?,?,?,?,?,?,?,?, 'Draft',?,?)`, [id, data.name, data.periodId ?? null, data.companyId ?? null, data.periodStart, data.periodEnd, data.structureId, version.id, data.employeeIds.length, data.currencyCode ?? 'INR'] as any[]);
  for (const employeeId of [...new Set<string>(data.employeeIds as string[])]) {
    const [employees] = await pool.execute<any[]>('SELECT * FROM employees WHERE id=? AND status=?', [employeeId, 'active']);
    if (!employees[0]) throw new ValidationError('Selected employee is not eligible');
    let contract: any = null;
    try { contract = await resolveActiveContract(employeeId, data.periodStart, data.periodEnd); } catch { /* warning below preserves the draft */ }
    const e = employees[0];
    await pool.execute(`INSERT INTO payslips (id,payrun_id,employee_id,contract_id,structure_id,structure_version_id,employee_name_snapshot,employee_code_snapshot,department_snapshot,job_position_snapshot,contract_reference_snapshot,currency_code,warning_codes)
      VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,JSON_ARRAY())`, [id, employeeId, contract?.id ?? null, data.structureId, version.id, `${e.first_name} ${e.last_name}`, e.employee_number, contract?.department ?? e.department_id, contract?.job_position ?? e.job_title, contract?.contractRef ?? null, data.currencyCode ?? 'INR'] as any[]);
  }
  await audit('Payrun', id, 'CREATED', actor, undefined, 'Draft');
  return getPayrun(id);
}

export async function getPayrun(id: string) {
  const run = await loadRun(id);
  const [payslips] = await pool.execute<any[]>('SELECT * FROM payslips WHERE payrun_id=? ORDER BY employee_name_snapshot', [id]);
  const [warnings] = await pool.execute<any[]>('SELECT * FROM payroll_warnings WHERE payrun_id=? ORDER BY created_at', [id]);
  const [delivery] = await pool.execute<any[]>('SELECT * FROM payslip_deliveries WHERE payrun_id=?', [id]);
  const [audits] = await pool.execute<any[]>('SELECT * FROM payroll_audit_logs WHERE entity_type=? AND entity_id=? ORDER BY performed_at', ['Payrun', id]);
  return { ...run, payslips, warnings, delivery, audit: audits };
}

export async function listPayruns(query: any) {
  const where = query.status ? 'WHERE status=?' : ''; const args = query.status ? [query.status] : [];
  const [rows] = await pool.execute<any[]>(`SELECT * FROM payruns ${where} ORDER BY period_end DESC LIMIT ? OFFSET ?`, [...args, Math.min(Number(query.limit) || 20, 100), ((Number(query.page) || 1) - 1) * (Number(query.limit) || 20)] as any[]);
  return { data: rows };
}

async function replaceWarnings(runId: string, slips: any[]) {
  await pool.execute('DELETE FROM payroll_warnings WHERE payrun_id=? AND status=?', [runId, 'OPEN']);
  for (const s of slips) {
    const items: any[] = [];
    if (!s.contract_id) items.push(['MISSING_CONTRACT', 'No running contract covers the full payroll period', 'ERROR', 1]);
    if (!s.bank_account && !s.iban) items.push(['MISSING_BANK_DETAILS', 'Employee has no bank or IBAN details', 'WARNING', 0]);
    if (num(s.worked_days) === 0) items.push(['ZERO_WORKED_DAYS', 'No worked days were recorded', 'WARNING', 0]);
    const [dups] = await pool.execute<any[]>(`SELECT p.id FROM payslips p JOIN payruns r ON r.id=p.payrun_id WHERE p.employee_id=? AND p.payrun_id<>? AND r.period_start<=? AND r.period_end>=? LIMIT 1`, [s.employee_id, runId, s.period_end, s.period_start]);
    if (dups[0]) items.push(['DUPLICATE_PAYSLIP', 'Employee already has a payslip in an overlapping payrun', 'ERROR', 1]);
    const [pendingLeave] = await pool.execute<any[]>(`SELECT COUNT(*) count FROM time_off_requests WHERE employee_id=? AND status IN ('Draft') AND start_date<=? AND end_date>=?`, [s.employee_id, s.period_end, s.period_start]);
    if (pendingLeave[0].count) items.push(['PENDING_TIME_OFF', 'Pending time-off overlaps this payroll period', 'WARNING', 0]);
    const [attendanceExceptions] = await pool.execute<any[]>(`SELECT COUNT(*) count FROM attendance_records WHERE employee_id=? AND date BETWEEN ? AND ? AND status IN ('Late','Absent','Missing Check-Out')`, [s.employee_id, s.period_start, s.period_end]);
    if (attendanceExceptions[0].count) items.push(['ATTENDANCE_EXCEPTION', 'Attendance exceptions require review', 'WARNING', 0]);
    for (const [code, message, severity, blocking] of items) await pool.execute(`INSERT INTO payroll_warnings (id,payrun_id,payslip_id,employee_id,code,message,severity,blocking) VALUES(UUID(),?,?,?,?,?,?,?)`, [runId, s.id, s.employee_id, code, message, severity, blocking]);
  }
  const [[count]] = await pool.execute<any[]>('SELECT COUNT(*) count FROM payroll_warnings WHERE payrun_id=? AND status=?', [runId, 'OPEN']);
  await pool.execute('UPDATE payruns SET warning_count=? WHERE id=?', [count.count, runId]);
}

export async function computePayrun(id: string, actor: Actor, recompute = false) {
  const run = await loadRun(id);
  if (run.status === 'Paid' || run.status === 'Validated') throw new AppError(409, 'Validated and paid payruns are immutable');
  if (recompute && run.status !== 'Computed') throw new AppError(409, 'Only a computed payrun may be recomputed');
  if (!recompute && !['Draft', 'Computed'].includes(run.status)) throw new AppError(409, 'Payrun cannot be computed');
  const [rules] = await pool.execute<any[]>('SELECT * FROM salary_rule_versions WHERE structure_version_id=? AND is_active=1 ORDER BY sequence,id', [run.structure_version_id]);
  if (!rules.length) throw new ValidationError('Salary Structure version has no active rules');
  const [slips] = await pool.execute<any[]>(`SELECT p.*, e.bank_account,e.iban FROM payslips p JOIN employees e ON e.id=p.employee_id WHERE p.payrun_id=?`, [id]);
  let grossTotal = 0, deductionTotal = 0, employerTotal = 0, netTotal = 0;
  for (const slip of slips) {
    let contract: any = null;
    try { contract = await resolveActiveContract(slip.employee_id, run.period_start, run.period_end); } catch { /* warning detector handles it */ }
    if (contract) await pool.execute('UPDATE payslips SET contract_id=?,contract_reference_snapshot=?,department_snapshot=?,job_position_snapshot=? WHERE id=?', [contract.id, contract.contractRef ?? null, contract.department ?? null, contract.jobPosition ?? null, slip.id]);
    const [[attendance]] = await pool.execute<any[]>(`SELECT COALESCE(SUM(worked_minutes),0) worked, COALESCE(SUM(overtime_minutes),0) overtime, COUNT(DISTINCT date) days FROM attendance_records WHERE employee_id=? AND date BETWEEN ? AND ? AND check_out IS NOT NULL`, [slip.employee_id, run.period_start, run.period_end]);
    const [[leave]] = await pool.execute<any[]>(`SELECT COALESCE(SUM(CASE WHEN t.is_paid=0 THEN r.days ELSE 0 END),0) unpaid FROM time_off_requests r JOIN time_off_types t ON t.id=r.type_id WHERE r.employee_id=? AND r.status IN ('Confirmed','Approved') AND r.start_date<=? AND r.end_date>=?`, [slip.employee_id, run.period_end, run.period_start]);
    const [inputs] = await pool.execute<any[]>('SELECT * FROM payroll_inputs WHERE payrun_id=? AND employee_id=?', [id, slip.employee_id]);
    const inputMap: Record<string, number> = {}; inputs.forEach(i => { inputMap[i.code] = (inputMap[i.code] || 0) + num(i.value); });
    const vars: Record<string, number> = { 'contract.wage': num(contract?.wage), worked_hours: num(attendance.worked) / 60, overtime_hours: num(attendance.overtime) / 60, worked_days: num(attendance.days), calendar_days: Math.floor((Date.parse(run.period_end) - Date.parse(run.period_start)) / 86400000) + 1, unpaid_leave: num(leave.unpaid) };
    Object.entries(inputMap).forEach(([k,v]) => { vars[`inputs.${k}`] = v; });
    await pool.execute('DELETE FROM payslip_calculation_traces WHERE payslip_id=?', [slip.id]); await pool.execute('DELETE FROM payslip_lines WHERE payslip_id=?', [slip.id]);
    let gross = 0, deductions = 0, employer = 0;
    for (const rule of rules) {
      let base = 0;
      if (rule.computation_method === 'fixed_amount') base = num(rule.amount);
      else if (rule.computation_method === 'percentage_of_gross') {
        const baseType = rule.percentage_base_type ?? 'GROSS'; base = baseType === 'BASIC' ? (vars['rules.BASIC'] ?? 0) : baseType === 'RULE' ? (vars[`rules.${rule.percentage_base_code}`] ?? 0) : baseType === 'INPUT' ? (vars[`inputs.${rule.percentage_base_code}`] ?? 0) : gross;
        base = base * num(rule.percentage) / 100;
      } else base = evaluateFormula(rule.formula ?? '0', { ...vars, 'rules.GROSS': gross, 'rules.NET': gross - deductions });
      const amount = round(base); vars[`rules.${rule.rule_code}`] = amount;
      if (rule.category === 'Deduction') deductions += amount; else if (rule.category === 'EmployerContribution') employer += amount; else if (!['Net', 'Gross'].includes(rule.category)) gross += amount;
      const lineId = crypto.randomUUID();
      await pool.execute(`INSERT INTO payslip_lines (id,payslip_id,rule_code,rule_name,category,amount,sequence,source_value,calculation_description) VALUES(?,?,?,?,?,?,?,?,?)`, [lineId, slip.id, rule.rule_code, rule.rule_name, rule.category, amount, rule.sequence, base, rule.formula ?? rule.computation_method]);
      await pool.execute(`INSERT INTO payslip_calculation_traces(id,payslip_id,payslip_line_id,rule_code,input_name,input_value,formula,result,sequence) VALUES(UUID(),?,?,?,?,?,?,?,?)`, [slip.id,lineId,rule.rule_code,'calculation',base,rule.formula ?? rule.computation_method,amount,rule.sequence]);
    }
    const net = round(gross - deductions);
    await pool.execute(`UPDATE payslips SET gross=?,deductions=?,employer_contributions=?,net=?,worked_days=?,worked_minutes=?,overtime_minutes=?,status='Computed',warning_codes=JSON_ARRAY() WHERE id=?`, [round(gross),round(deductions),round(employer),net,num(attendance.days),num(attendance.worked),num(attendance.overtime),slip.id]);
    grossTotal += gross; deductionTotal += deductions; employerTotal += employer; netTotal += net;
  }
  const [newSlips] = await pool.execute<any[]>(`SELECT p.*,e.bank_account,e.iban,r.period_start,r.period_end FROM payslips p JOIN employees e ON e.id=p.employee_id JOIN payruns r ON r.id=p.payrun_id WHERE p.payrun_id=?`, [id]);
  await replaceWarnings(id, newSlips);
  await pool.execute(`UPDATE payruns SET status='Computed',total_gross=?,total_deductions=?,total_employer_contributions=?,total_net=?,computed_at=NOW(),computed_by=? WHERE id=?`, [round(grossTotal),round(deductionTotal),round(employerTotal),round(netTotal),actor.id,id]);
  await audit('Payrun', id, recompute ? 'RECOMPUTED' : 'COMPUTED', actor, run.status, 'Computed'); return getPayrun(id);
}

export async function validatePayrun(id: string, actor: Actor) {
  const run = await loadRun(id); if (run.status !== 'Computed') throw new AppError(409, 'Payrun must be Computed before validation');
  const [[slips]] = await pool.execute<any[]>('SELECT COUNT(*) count FROM payslips WHERE payrun_id=?', [id]); if (!slips.count) throw new ValidationError('Payrun contains no payslips');
  const [[blocking]] = await pool.execute<any[]>('SELECT COUNT(*) count FROM payroll_warnings WHERE payrun_id=? AND blocking=1 AND status=?', [id, 'OPEN']); if (blocking.count) throw new ValidationError('Resolve blocking payroll warnings before validation');
  const [[mismatch]] = await pool.execute<any[]>(`SELECT COUNT(*) count FROM payslips p LEFT JOIN (SELECT payslip_id,SUM(CASE WHEN category NOT IN ('Deduction','EmployerContribution','Net','Gross') THEN amount ELSE 0 END) earnings,SUM(CASE WHEN category='Deduction' THEN amount ELSE 0 END) deductions FROM payslip_lines GROUP BY payslip_id) l ON l.payslip_id=p.id WHERE p.payrun_id=? AND (ROUND(p.gross,2)<>ROUND(COALESCE(l.earnings,0),2) OR ROUND(p.deductions,2)<>ROUND(COALESCE(l.deductions,0),2))`, [id]);
  if (mismatch.count) throw new ValidationError('Computation mismatch detected');
  await pool.execute(`UPDATE payruns SET status='Validated',validated_at=NOW(),validated_by=? WHERE id=?`, [actor.id,id]); await pool.execute(`UPDATE payslips SET status='Validated' WHERE payrun_id=?`, [id]); await audit('Payrun',id,'VALIDATED',actor,'Computed','Validated'); return getPayrun(id);
}

export async function markPaid(id: string, actor: Actor, data: any = {}) {
  const run = await loadRun(id); if (run.status !== 'Validated') throw new AppError(409, 'Payrun must be Validated before payment');
  const [slips] = await pool.execute<any[]>('SELECT * FROM payslips WHERE payrun_id=?', [id]);
  for (const s of slips) await pool.execute(`INSERT IGNORE INTO payroll_payments(id,payrun_id,payslip_id,employee_id,amount,currency_code,payment_method,status,payment_reference,provider,initiated_at,completed_at) VALUES(UUID(),?,?,?,?,?,?, 'Paid',?,?,NOW(),NOW())`, [id,s.id,s.employee_id,s.net,run.currency_code,data.paymentMethod ?? 'Manual',data.paymentReference ?? null,data.provider ?? 'Manual']);
  await pool.execute(`UPDATE payruns SET status='Paid',paid_at=NOW(),paid_by=? WHERE id=?`, [actor.id,id]); await pool.execute(`UPDATE payslips SET status='Paid' WHERE payrun_id=?`, [id]); await audit('Payrun',id,'MARKED_PAID',actor,'Validated','Paid'); return getPayrun(id);
}

export async function addInput(runId: string, data: any, actor: Actor) {
  const run = await loadRun(runId); if (['Validated','Paid'].includes(run.status)) throw new AppError(409,'Payroll inputs are immutable after validation');
  if (data.source === 'MANUAL' && !data.reason) throw new ValidationError('Manual payroll inputs require a reason');
  await pool.execute(`INSERT INTO payroll_inputs(id,payrun_id,employee_id,code,name,category,value,unit,source,source_reference,is_manual,reason,created_by) VALUES(UUID(),?,?,?,?,?,?,?,?,?,?,?,?)`, [runId,data.employeeId,data.code,data.name,data.category,data.value,data.unit ?? null,data.source,data.sourceReference ?? null,data.source === 'MANUAL',data.reason ?? null,actor.id]); await audit('Payrun',runId,'INPUT_ADDED',actor,undefined,undefined,{ code:data.code,employeeId:data.employeeId });
}
export async function listInputs(runId:string) { const [rows]=await pool.execute<any[]>('SELECT * FROM payroll_inputs WHERE payrun_id=? ORDER BY created_at',[runId]); return {data:rows}; }
export async function updateInput(id:string,data:any,actor:Actor) { const [rows]=await pool.execute<any[]>('SELECT pi.*,p.status FROM payroll_inputs pi JOIN payruns p ON p.id=pi.payrun_id WHERE pi.id=?',[id]); if(!rows[0])throw new NotFoundError('Payroll input not found'); if(['Validated','Paid'].includes(rows[0].status))throw new AppError(409,'Payroll inputs are immutable after validation'); if(data.source==='MANUAL'&&!data.reason)throw new ValidationError('Manual payroll inputs require a reason'); const allowed=['code','name','category','value','unit','source','sourceReference','reason'];const columns:any={sourceReference:'source_reference'};const sets:string[]=[];const args:any[]=[];for(const k of allowed)if(k in data){sets.push(`${columns[k]??k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())}=?`);args.push(data[k]);}if(sets.length){args.push(id);await pool.execute(`UPDATE payroll_inputs SET ${sets.join(',')} WHERE id=?`,args);}await audit('Payrun',rows[0].payrun_id,'INPUT_UPDATED',actor); }
export async function deleteInput(id:string,actor:Actor) { const [rows]=await pool.execute<any[]>('SELECT pi.*,p.status FROM payroll_inputs pi JOIN payruns p ON p.id=pi.payrun_id WHERE pi.id=?',[id]);if(!rows[0])throw new NotFoundError('Payroll input not found');if(['Validated','Paid'].includes(rows[0].status))throw new AppError(409,'Payroll inputs are immutable after validation');await pool.execute('DELETE FROM payroll_inputs WHERE id=?',[id]);await audit('Payrun',rows[0].payrun_id,'INPUT_DELETED',actor); }
export async function listPayments(runId:string) { const [rows]=await pool.execute<any[]>('SELECT * FROM payroll_payments WHERE payrun_id=?',[runId]);return {data:rows}; }
export async function listDelivery(runId:string) { const [rows]=await pool.execute<any[]>('SELECT * FROM payslip_deliveries WHERE payrun_id=?',[runId]);return {data:rows}; }

export async function resolveWarning(id: string, note: string, actor: Actor) { await pool.execute(`UPDATE payroll_warnings SET status='RESOLVED',resolution_note=?,resolved_by=?,resolved_at=NOW() WHERE id=? AND status='OPEN'`, [note ?? null,actor.id,id]); const [rows]=await pool.execute<any[]>('SELECT payrun_id FROM payroll_warnings WHERE id=?',[id]); if(!rows[0]) throw new NotFoundError('Warning not found'); await audit('Payrun',rows[0].payrun_id,'WARNING_RESOLVED',actor,undefined,undefined,{warningId:id}); }

export async function getPayslip(id: string) { const [s]=await pool.execute<any[]>('SELECT * FROM payslips WHERE id=?',[id]); if(!s[0]) throw new NotFoundError('Payslip not found'); const [lines]=await pool.execute<any[]>('SELECT * FROM payslip_lines WHERE payslip_id=? ORDER BY sequence',[id]); const [trace]=await pool.execute<any[]>('SELECT * FROM payslip_calculation_traces WHERE payslip_id=? ORDER BY sequence',[id]); const [warnings]=await pool.execute<any[]>('SELECT * FROM payroll_warnings WHERE payslip_id=?',[id]); return {...s[0],lines,trace,warnings}; }
export async function listPayslips(query:any) { const where=query.payrunId?'WHERE payrun_id=?':''; const [rows]=await pool.execute<any[]>(`SELECT * FROM payslips ${where} ORDER BY employee_name_snapshot`,query.payrunId?[query.payrunId]:[]); return {data:rows}; }
export async function sendPayslips(runId:string, actor:Actor, retry=false) { const run=await loadRun(runId); if(run.status!=='Paid') throw new AppError(409,'Payslips can only be delivered after payment'); const [slips]=await pool.execute<any[]>(`SELECT p.*,e.work_email FROM payslips p JOIN employees e ON e.id=p.employee_id WHERE p.payrun_id=?`,[runId]); const results=[]; for(const s of slips){ const [existing]=await pool.execute<any[]>('SELECT * FROM payslip_deliveries WHERE payslip_id=?',[s.id]); if(existing[0]?.status==='Sent') { results.push(existing[0]); continue; } if(existing[0]&&!retry) { results.push(existing[0]); continue; } const failed=!s.work_email; await pool.execute(`INSERT INTO payslip_deliveries(id,payrun_id,payslip_id,employee_id,recipient_email,status,attempt_count,error_message,last_attempt_at,sent_at) VALUES(UUID(),?,?,?,?,?,1,?,NOW(),?) ON DUPLICATE KEY UPDATE status=VALUES(status),attempt_count=attempt_count+1,error_message=VALUES(error_message),last_attempt_at=NOW(),sent_at=VALUES(sent_at)`,[runId,s.id,s.employee_id,s.work_email ?? '',failed?'Failed':'Sent',failed?'Missing recipient email':null,failed?null:new Date()] as any[]); results.push({payslipId:s.id,status:failed?'Failed':'Sent'}); } await audit('Payrun',runId,retry?'DELIVERY_RETRIED':'PAYSLIPS_SENT',actor,undefined,undefined,{results}); return results; }
export async function createPeriod(data:any,actor:Actor){ if(data.periodEnd<data.periodStart) throw new ValidationError('Invalid payroll period'); const id=crypto.randomUUID(); await pool.execute(`INSERT INTO payroll_periods(id,name,company_id,period_start,period_end,payment_date,frequency,created_by) VALUES(?,?,?,?,?,?,?,?)`,[id,data.name,data.companyId??null,data.periodStart,data.periodEnd,data.paymentDate??null,data.frequency??'Monthly',actor.id]); return {id,...data}; }
export async function listPeriods(){ const [rows]=await pool.execute<any[]>('SELECT * FROM payroll_periods ORDER BY period_end DESC'); return {data:rows}; }
