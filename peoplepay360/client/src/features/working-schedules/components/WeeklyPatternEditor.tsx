import { DayPattern, DayName } from '../types';

interface Props {
  days: DayPattern[];
  onChange: (days: DayPattern[]) => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function computeWeeklyHours(days: DayPattern[]): number {
  let total = 0;
  for (const d of days) {
    if (!d.active || !d.start || !d.end) continue;
    const diff = timeToMinutes(d.end) - timeToMinutes(d.start) - (d.breakMinutes || 0);
    if (diff > 0) total += diff;
  }
  return Math.round((total / 60) * 100) / 100;
}

const DAY_LABELS: Record<DayName, { short: string; full: string }> = {
  monday: { short: 'Mon', full: 'Monday' },
  tuesday: { short: 'Tue', full: 'Tuesday' },
  wednesday: { short: 'Wed', full: 'Wednesday' },
  thursday: { short: 'Thu', full: 'Thursday' },
  friday: { short: 'Fri', full: 'Friday' },
  saturday: { short: 'Sat', full: 'Saturday' },
  sunday: { short: 'Sun', full: 'Sunday' },
};

export default function WeeklyPatternEditor({ days, onChange }: Props) {
  function update(index: number, patch: Partial<DayPattern>) {
    const updated = days.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange(updated);
  }

  const weeklyHours = computeWeeklyHours(days);

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 80px 140px 140px 140px 1fr',
          padding: '10px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#64748b',
        }}
      >
        <span>Day</span>
        <span style={{ textAlign: 'center' }}>Working</span>
        <span>Start Time</span>
        <span>End Time</span>
        <span>Break (Min)</span>
        <span style={{ textAlign: 'right' }}>Daily Hours</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {days.map((d, i) => {
          let dailyNet = 0;
          if (d.active && d.start && d.end) {
            const diff = timeToMinutes(d.end) - timeToMinutes(d.start) - (d.breakMinutes || 0);
            if (diff > 0) dailyNet = Math.round((diff / 60) * 10) / 10;
          }

          return (
            <div
              key={d.day}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 80px 140px 140px 140px 1fr',
                padding: '10px 16px',
                alignItems: 'center',
                borderBottom: i < days.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: d.active ? '#ffffff' : '#fafafa',
                opacity: d.active ? 1 : 0.65,
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <strong style={{ color: d.active ? '#0f172a' : '#94a3b8', fontSize: '13px' }}>
                  {DAY_LABELS[d.day]?.full ?? d.day}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={d.active}
                  onChange={(e) =>
                    update(i, {
                      active: e.target.checked,
                      start: e.target.checked ? (d.start ?? '09:00') : null,
                      end: e.target.checked ? (d.end ?? '18:00') : null,
                    })
                  }
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--primary-600)',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div>
                <input
                  type="time"
                  className="app-input"
                  value={d.start ?? ''}
                  disabled={!d.active}
                  onChange={(e) => update(i, { start: e.target.value || null })}
                  style={{
                    padding: '4px 8px',
                    fontSize: '13px',
                    width: '110px',
                    background: d.active ? '#ffffff' : '#f1f5f9',
                  }}
                />
              </div>

              <div>
                <input
                  type="time"
                  className="app-input"
                  value={d.end ?? ''}
                  disabled={!d.active}
                  onChange={(e) => update(i, { end: e.target.value || null })}
                  style={{
                    padding: '4px 8px',
                    fontSize: '13px',
                    width: '110px',
                    background: d.active ? '#ffffff' : '#f1f5f9',
                  }}
                />
              </div>

              <div>
                <input
                  type="number"
                  min={0}
                  step={5}
                  className="app-input"
                  value={d.breakMinutes ?? 0}
                  disabled={!d.active}
                  onChange={(e) => update(i, { breakMinutes: parseInt(e.target.value, 10) || 0 })}
                  style={{
                    padding: '4px 8px',
                    fontSize: '13px',
                    width: '90px',
                    background: d.active ? '#ffffff' : '#f1f5f9',
                  }}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: d.active ? '#0f172a' : '#94a3b8',
                  }}
                >
                  {d.active ? `${dailyNet} hrs` : 'Off'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
          Weekly Computed Working Hours
        </span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 800,
            color: '#166534',
            background: '#ecfdf5',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid #a7f3d0',
          }}
        >
          {weeklyHours} Total Hours / Week
        </span>
      </div>
    </div>
  );
}
