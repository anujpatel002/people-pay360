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
    const diff = timeToMinutes(d.end) - timeToMinutes(d.start) - d.breakMinutes;
    if (diff > 0) total += diff;
  }
  return Math.round((total / 60) * 100) / 100;
}

const DAY_LABELS: Record<DayName, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function WeeklyPatternEditor({ days, onChange }: Props) {
  function update(index: number, patch: Partial<DayPattern>) {
    const updated = days.map((d, i) => i === index ? { ...d, ...patch } : d);
    onChange(updated);
  }

  const weeklyHours = computeWeeklyHours(days);

  return (
    <div style={s.wrapper}>
      <div style={s.headerRow}>
        <span style={s.colDay}>Day</span>
        <span style={s.colActive}>Active</span>
        <span style={s.colTime}>Start</span>
        <span style={s.colTime}>End</span>
        <span style={s.colBreak}>Break (min)</span>
      </div>

      {days.map((d, i) => (
        <div key={d.day} style={{ ...s.row, opacity: d.active ? 1 : 0.45 }}>
          <span style={s.colDay}>{DAY_LABELS[d.day]}</span>
          <span style={s.colActive}>
            <input type="checkbox" checked={d.active}
              onChange={(e) => update(i, {
                active: e.target.checked,
                start: e.target.checked ? (d.start ?? '09:00') : null,
                end:   e.target.checked ? (d.end   ?? '18:00') : null,
              })}
            />
          </span>
          <span style={s.colTime}>
            <input style={s.timeInput} type="time" value={d.start ?? ''} disabled={!d.active}
              onChange={(e) => update(i, { start: e.target.value || null })} />
          </span>
          <span style={s.colTime}>
            <input style={s.timeInput} type="time" value={d.end ?? ''} disabled={!d.active}
              onChange={(e) => update(i, { end: e.target.value || null })} />
          </span>
          <span style={s.colBreak}>
            <input style={s.breakInput} type="number" min={0} value={d.breakMinutes} disabled={!d.active}
              onChange={(e) => update(i, { breakMinutes: parseInt(e.target.value, 10) || 0 })} />
          </span>
        </div>
      ))}

      <div style={s.total}>
        Total Weekly Hours: <strong>{weeklyHours}h</strong>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  headerRow: { display: 'flex', background: '#f9fafb', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  row: { display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: '1px solid #f3f4f6' },
  colDay:    { width: 80, fontSize: '0.875rem', fontWeight: 500 },
  colActive: { width: 60, display: 'flex', justifyContent: 'center' },
  colTime:   { width: 110 },
  colBreak:  { width: 100 },
  timeInput:  { padding: '0.3rem', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '0.85rem', width: 95 },
  breakInput: { padding: '0.3rem', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '0.85rem', width: 70 },
  total: { padding: '0.75rem 1rem', background: '#f0fdf4', fontSize: '0.9rem', color: '#166534', borderTop: '1px solid #e5e7eb' },
};
