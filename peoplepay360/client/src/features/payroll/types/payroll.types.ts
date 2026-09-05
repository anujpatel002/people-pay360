export type PayrunStatus = 'Draft'|'Computed'|'Validated'|'Paid';
export interface Payrun { id:string; name:string; period_start:string; period_end:string; structure_id:string; status:PayrunStatus; total_gross:number; total_net:number; warning_count:number; employee_count:number; payslips?:Payslip[]; warnings?:PayrollWarning[]; }
export interface Payslip { id:string; employee_id:string; employee_name_snapshot:string; gross:number; deductions:number; net:number; status:PayrunStatus; worked_days:number; lines?:PayslipLine[]; }
export interface PayslipLine { id:string; rule_code:string; rule_name:string; category:string; amount:number; sequence:number; calculation_description?:string; }
export interface PayrollWarning { id:string; code:string; message:string; blocking:boolean; severity:string; status:string; }
