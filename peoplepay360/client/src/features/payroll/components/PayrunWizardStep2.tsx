import { useEffect, useState, useMemo } from 'react';
import { getContractLookups } from '@/features/contracts/services/contracts.service';

interface Props {
  ids: string[];
  setIds: (v: string[]) => void;
  onBack: () => void;
  onCreate: () => void;
}

export default function PayrunWizardStep2({ ids, setIds, onBack, onCreate }: Props) {
  const [employees, setEmployees] = useState<
    { id: string; name: string; employeeNumber?: string; departmentName?: string; jobTitle?: string }[]
  >([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualText, setManualText] = useState(ids.join('\n'));

  useEffect(() => {
    getContractLookups()
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEmployees(false));
  }, []);

  // Map employee IDs and numbers for instant recognition
  const employeeMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; employeeNumber?: string; departmentName?: string }>();
    for (const emp of employees) {
      map.set(emp.id.toLowerCase(), emp);
      if (emp.employeeNumber) {
        map.set(emp.employeeNumber.toLowerCase(), emp);
        map.set(`emp-${emp.employeeNumber.replace(/^emp-/i, '')}`.toLowerCase(), emp);
        map.set(emp.employeeNumber.replace(/^emp-/i, '').toLowerCase(), emp);
      }
    }
    return map;
  }, [employees]);

  // Sync manual text to ids
  const handleTextChange = (text: string) => {
    setManualText(text);
    const list = text
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setIds(Array.from(new Set(list)));
  };

  // Add individual employee from roster
  const toggleEmployee = (empKey: string) => {
    const exists = ids.includes(empKey);
    let updated: string[];
    if (exists) {
      updated = ids.filter((id) => id !== empKey);
    } else {
      updated = [...ids, empKey];
    }
    setIds(updated);
    setManualText(updated.join('\n'));
  };

  // Select all employees
  const selectAll = () => {
    const allKeys = employees.map((e) => e.employeeNumber || e.id);
    setIds(allKeys);
    setManualText(allKeys.join('\n'));
  };

  // Clear all
  const clearAll = () => {
    setIds([]);
    setManualText('');
  };

  // Filtered roster for quick selection
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees.slice(0, 8);
    const query = searchTerm.toLowerCase().trim();
    return employees
      .filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          (e.employeeNumber && e.employeeNumber.toLowerCase().includes(query)) ||
          (e.departmentName && e.departmentName.toLowerCase().includes(query))
      )
      .slice(0, 10);
  }, [employees, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Step 2: Select Employees for Payrun Batch
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Choose employees from the directory, search by name/number, or paste employee codes in bulk.
        </p>
      </div>

      {/* Quick Search & Select Bar */}
      <div
        style={{
          padding: '16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <label className="app-label" style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>
            🔍 Search & Add from Roster
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={selectAll}
              disabled={loadingEmployees || employees.length === 0}
              className="app-btn app-btn-secondary"
              style={{ padding: '3px 9px', fontSize: '11.5px' }}
            >
              ✓ Select All ({employees.length})
            </button>
            {ids.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="app-btn app-btn-subtle"
                style={{ padding: '3px 9px', fontSize: '11.5px', color: '#dc2626' }}
              >
                ✕ Clear All
              </button>
            )}
          </div>
        </div>

        <input
          className="app-input"
          placeholder="Type employee name (e.g. Priya Sharma), ID (EMP-10151), or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ background: '#ffffff' }}
        />

        {/* Suggested / Matching Employee Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
          {loadingEmployees ? (
            <span style={{ fontSize: '12px', color: '#64748b' }}>Loading roster...</span>
          ) : filteredEmployees.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>No matching employees found</span>
          ) : (
            filteredEmployees.map((emp) => {
              const empKey = emp.employeeNumber || emp.id;
              const isSelected = ids.some(
                (id) =>
                  id.toLowerCase() === emp.id.toLowerCase() ||
                  (emp.employeeNumber && id.toLowerCase() === emp.employeeNumber.toLowerCase())
              );
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleEmployee(empKey)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{isSelected ? '✓' : '+'}</span>
                  <span>{emp.name}</span>
                  {emp.employeeNumber && (
                    <span style={{ color: isSelected ? '#3b82f6' : '#94a3b8', fontSize: '11px' }}>
                      #{emp.employeeNumber}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Manual / Bulk Text Area */}
      <div className="app-form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="app-label">Employee IDs or Employee Numbers *</label>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
            Supports #EMP-10151, EMP-10151, or UUIDs
          </span>
        </div>
        <textarea
          className="app-input"
          rows={5}
          placeholder="e.g.&#10;EMP-10151&#10;EMP-10152&#10;20000000-0000-0000-0000-000000000001"
          value={manualText}
          onChange={(e) => handleTextChange(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
        />
      </div>

      {/* Selected Scope Summary Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          background: ids.length > 0 ? '#eff6ff' : '#f8fafc',
          border: ids.length > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '13.5px', color: ids.length > 0 ? '#1e40af' : '#64748b', fontWeight: 700 }}>
            {ids.length} Employee{ids.length === 1 ? '' : 's'} Selected for Payroll Run
          </span>
          {ids.length > 0 && (
            <span style={{ fontSize: '11.5px', color: '#3b82f6' }}>
              Attendance, leaves, and salary rules will be batch computed for all selected members.
            </span>
          )}
        </div>
        {ids.length > 0 && <span className="app-badge app-badge-info">Ready to Create</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <button type="button" onClick={onBack} className="app-btn app-btn-secondary">
          ‹ Back to Step 1
        </button>

        <button
          type="button"
          disabled={ids.length === 0}
          onClick={onCreate}
          className="app-btn app-btn-primary"
          style={{ padding: '9px 20px', fontWeight: 700 }}
        >
          🚀 Create Draft Payrun
        </button>
      </div>
    </div>
  );
}
