import { ContractStatus } from '../types/contract.types';

const STATUS_STYLES: Record<ContractStatus, React.CSSProperties> = {
  Running:   { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' },
  New:       { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
  Expired:   { background: '#fef9c3', color: '#a16207', border: '1px solid #fef08a' },
  Cancelled: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
};

export default function ActiveContractBadge({ status }: { status: ContractStatus }) {
  return (
    <span style={{ ...BASE, ...STATUS_STYLES[status] }}>
      {status === 'Running' ? '● ' : ''}{status}
    </span>
  );
}

const BASE: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 12,
  fontSize: '0.78rem',
  fontWeight: 600,
};
