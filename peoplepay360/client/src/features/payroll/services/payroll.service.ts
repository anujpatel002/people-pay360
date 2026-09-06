import http from '@/shared/services/httpClient'; import { Payrun, Payslip } from '../types/payroll.types';
export const getPayruns=async()=> (await http.get<{data:Payrun[]}>('/payroll/payruns')).data;
export const getPayrun=async(id:string)=> (await http.get<Payrun>(`/payroll/payruns/${id}`)).data;
export const createPayrun=async(p:unknown)=> (await http.post<Payrun>('/payroll/payruns',p)).data;
export const deletePayrun=async(id:string)=> (await http.delete(`/payroll/payruns/${id}`)).data;
export const resolveWarning=async(id:string,resolutionNote?:string)=> (await http.post(`/payroll/warnings/${id}/resolve`,{resolutionNote})).data;
export const action=async(id:string,name:'compute'|'recompute'|'validate'|'mark-paid'|'send')=> (await http.post<Payrun>(`/payroll/payruns/${id}/${name}`)).data;
export const getPayslip=async(id:string)=> (await http.get<Payslip>(`/payroll/payslips/${id}`)).data;
