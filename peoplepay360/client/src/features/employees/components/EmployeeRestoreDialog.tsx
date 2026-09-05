interface Props {
  employeeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function EmployeeRestoreDialog({ employeeName, onConfirm, onCancel, loading }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 400, width: '90%' }}>
        <h3 style={{ margin: '0 0 8px' }}>Restore Employee</h3>
        <p style={{ color: '#374151', margin: '0 0 20px' }}>
          Restore <strong>{employeeName}</strong> to active status?
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 16px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      </div>
    </div>
  );
}
