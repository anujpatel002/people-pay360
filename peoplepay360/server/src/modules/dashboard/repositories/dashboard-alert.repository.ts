/**
 * dashboard-alert.repository.ts
 * Read and write queries for dashboard_alerts lifecycle and reconciliation.
 */
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import {
  DashboardAlert,
  DashboardAlertSummary,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '../types/dashboard.types';

interface AlertRow extends RowDataPacket {
  id: string;
  company_id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  employee_id: string | null;
  status: AlertStatus;
  blocking: number;
  metadata: any;
  dedup_key: string;
  first_detected_at: Date;
  last_detected_at: Date;
  resolved_at: Date | null;
  resolved_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRowToAlert(r: AlertRow): DashboardAlert {
  return {
    id: r.id,
    companyId: r.company_id,
    type: r.type,
    severity: r.severity,
    title: r.title,
    message: r.message,
    entityType: r.entity_type,
    entityId: r.entity_id,
    employeeId: r.employee_id,
    status: r.status,
    blocking: Boolean(r.blocking),
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
    dedupKey: r.dedup_key,
    firstDetectedAt: r.first_detected_at ? new Date(r.first_detected_at).toISOString() : '',
    lastDetectedAt: r.last_detected_at ? new Date(r.last_detected_at).toISOString() : '',
    resolvedAt: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
    resolvedBy: r.resolved_by,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

export interface UpsertAlertParams {
  companyId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  employeeId?: string;
  blocking: boolean;
  metadata?: Record<string, unknown>;
  dedupKey: string;
}

export async function upsertAlert(data: UpsertAlertParams): Promise<void> {
  await pool.execute(`
    INSERT INTO dashboard_alerts (
      id, company_id, type, severity, title, message,
      entity_type, entity_id, employee_id, status, blocking,
      metadata, dedup_key, first_detected_at, last_detected_at
    ) VALUES (
      UUID(), ?, ?, ?, ?, ?,
      ?, ?, ?, 'OPEN', ?,
      ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
      company_id = VALUES(company_id),
      last_detected_at = CURRENT_TIMESTAMP,
      message = VALUES(message),
      severity = VALUES(severity),
      blocking = VALUES(blocking),
      metadata = VALUES(metadata),
      status = IF(status IN ('RESOLVED', 'DISMISSED'), 'OPEN', status)
  `, [
    data.companyId,
    data.type,
    data.severity,
    data.title,
    data.message,
    data.entityType ?? null,
    data.entityId ?? null,
    data.employeeId ?? null,
    data.blocking ? 1 : 0,
    data.metadata ? JSON.stringify(data.metadata) : null,
    data.dedupKey,
  ]);
}

export async function getAlertSummaries(companyId?: string): Promise<DashboardAlertSummary[]> {
  const conditions: string[] = ["status IN ('OPEN', 'ACKNOWLEDGED')"];
  const params: unknown[] = [];

  if (companyId) {
    conditions.push('company_id = ?');
    params.push(companyId);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.execute<(RowDataPacket & {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    count: number;
    title: string;
    message: string;
    blocking: number;
    status: AlertStatus;
  })[]>(`
    SELECT
      MIN(id) AS id,
      type,
      MAX(CASE WHEN severity = 'CRITICAL' THEN 3 WHEN severity = 'WARNING' THEN 2 ELSE 1 END) AS max_sev,
      CASE
        WHEN MAX(CASE WHEN severity = 'CRITICAL' THEN 3 WHEN severity = 'WARNING' THEN 2 ELSE 1 END) = 3 THEN 'CRITICAL'
        WHEN MAX(CASE WHEN severity = 'CRITICAL' THEN 3 WHEN severity = 'WARNING' THEN 2 ELSE 1 END) = 2 THEN 'WARNING'
        ELSE 'INFO'
      END AS severity,
      COUNT(id) AS count,
      MIN(message) AS message,
      MAX(blocking) AS blocking,
      MIN(status) AS status
    FROM dashboard_alerts
    ${where}
    GROUP BY type
    ORDER BY max_sev DESC, count DESC
  `, params as any[]);

  return rows.map(r => ({
    id: r.id,
    type: r.type,
    severity: r.severity,
    count: Number(r.count),
    message: r.count > 1 ? `${r.count} ${formatTypeLabel(r.type, r.count)}` : r.message,
    blocking: Boolean(r.blocking),
    status: r.status,
  }));
}

function formatTypeLabel(type: AlertType, count: number): string {
  switch (type) {
    case 'MISSING_BANK_DETAILS':
      return `employees are missing bank details`;
    case 'DUPLICATE_PAYSLIP':
      return `duplicate payslips detected`;
    case 'UNVALIDATED_PAYRUN':
      return `payruns require validation`;
    case 'EXPIRING_CONTRACT':
      return `contracts expiring within 30 days`;
    default:
      return `issues detected`;
  }
}

export async function getAlertsList(filters: {
  companyId?: string;
  status?: AlertStatus;
  limit?: number;
}): Promise<DashboardAlert[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.companyId) {
    conditions.push('company_id = ?');
    params.push(filters.companyId);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  } else {
    conditions.push("status IN ('OPEN', 'ACKNOWLEDGED')");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = filters.limit ? `LIMIT ${Math.min(100, Math.max(1, filters.limit))}` : 'LIMIT 50';

  const [rows] = await pool.execute<AlertRow[]>(`
    SELECT * FROM dashboard_alerts
    ${where}
    ORDER BY
      CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'WARNING' THEN 2 ELSE 3 END ASC,
      last_detected_at DESC
    ${limitClause}
  `, params as any[]);

  return rows.map(mapRowToAlert);
}

export async function getAlertById(id: string): Promise<DashboardAlert | null> {
  const [rows] = await pool.execute<AlertRow[]>(
    'SELECT * FROM dashboard_alerts WHERE id = ? LIMIT 1',
    [id]
  );
  if (!rows.length) return null;
  return mapRowToAlert(rows[0]);
}

export async function updateAlertStatus(
  id: string,
  status: AlertStatus,
  resolvedBy?: string
): Promise<DashboardAlert | null> {
  const isResolved = status === 'RESOLVED' || status === 'DISMISSED';
  await pool.execute(`
    UPDATE dashboard_alerts
    SET
      status = ?,
      resolved_at = ${isResolved ? 'CURRENT_TIMESTAMP' : 'NULL'},
      resolved_by = ${isResolved && resolvedBy ? '?' : 'NULL'},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, isResolved && resolvedBy ? [status, resolvedBy, id] : [status, id]);

  return getAlertById(id);
}

export async function autoResolveClearedAlerts(
  activeDedupKeys: string[],
  type: AlertType,
  companyId?: string
): Promise<void> {
  const conditions: string[] = ["type = ?", "status IN ('OPEN', 'ACKNOWLEDGED')"];
  const params: unknown[] = [type];

  if (companyId) {
    conditions.push('company_id = ?');
    params.push(companyId);
  }

  if (activeDedupKeys.length > 0) {
    const placeholders = activeDedupKeys.map(() => '?').join(',');
    conditions.push(`dedup_key NOT IN (${placeholders})`);
    params.push(...activeDedupKeys);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  await pool.execute(`
    UPDATE dashboard_alerts
    SET
      status = 'RESOLVED',
      resolved_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    ${where}
  `, params as any[]);
}
