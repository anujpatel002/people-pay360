interface Props {
  employeeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function EmployeeArchiveDialog({
  employeeName,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="app-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ⚠️
          </div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            Archive Employee
          </h3>
        </div>

        <p style={{ color: '#475569', fontSize: '13.5px', lineHeight: 1.5, margin: '0 0 20px' }}>
          Are you sure you want to archive <strong>{employeeName}</strong>? Archived employees are deactivated from self-service portal, new attendance clocking, and active rosters.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="app-btn app-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="app-btn app-btn-danger"
          >
            {loading ? 'Archiving...' : 'Confirm Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}
