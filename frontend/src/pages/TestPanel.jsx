import { useState, useEffect } from 'react';
import { testAPI, deadmanAPI, nomineesAPI } from '../utils/api';
import { Alert } from '../components/UI';

const TESTS = [
  {
    id: 'warning',
    label: 'Simulate Warning State',
    desc: '26 days since last check-in. Warning email sent to vault owner. 4 days remaining.',
    icon: '⚠️',
    color: '#e8c96a',
    action: () => testAPI.simulateWarning(),
  },
  {
    id: 'trigger',
    label: 'Simulate Trigger (30+ days)',
    desc: 'Sets switch as overdue + triggered. Sends notification email to all nominees. Contest window opens.',
    icon: '🔴',
    color: '#c45555',
    action: () => testAPI.simulateTrigger(),
  },
  {
    id: 'nominee-flow',
    label: 'Simulate Full Nominee Flow',
    desc: 'Walks through invite → trigger → priority resolution → vault unlock (email only, no actual unlock).',
    icon: '📋',
    color: '#8899ee',
    action: () => testAPI.simulateNomineeFlow(),
  },
  {
    id: 'checkin',
    label: 'Confirm Check-in (Reset via API)',
    desc: 'Calls the real check-in endpoint. Resets triggered/warning state, extends deadline 30 days.',
    icon: '✅',
    color: '#4caf7d',
    action: () => deadmanAPI.confirmCheckin(),
  },
  {
    id: 'reset',
    label: 'Full Reset All Test State',
    desc: 'Resets dead man switch to normal (30 day window, no warnings, no triggers).',
    icon: '🔄',
    color: 'var(--gold)',
    action: () => testAPI.reset(),
  },
];

const ResultBlock = ({ result }) => {
  if (!result) return null;
  const isErr = result.error;
  return (
    <div style={{ marginTop: 14, background: isErr ? 'rgba(196,85,85,0.06)' : 'rgba(76,175,125,0.06)', border: `1px solid ${isErr ? 'rgba(196,85,85,0.3)' : 'rgba(76,175,125,0.2)'}`, borderRadius: 2, padding: 14 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: isErr ? '#c45555' : '#4caf7d', marginBottom: 8 }}>
        {isErr ? '✕ Failed' : '✓ Success'}
      </div>
      <pre style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};

function TestCard({ test }) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const run = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await test.action();
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, padding: 20, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{test.icon}</span>
            <span style={{ fontSize: 13, color: test.color, fontWeight: 500 }}>{test.label}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{test.desc}</div>
        </div>
        <button onClick={run} disabled={loading}
          style={{ padding: '10px 18px', background: loading ? 'var(--surface)' : 'transparent', border: `1px solid ${loading ? 'var(--border)' : test.color}`, borderRadius: 2, color: loading ? 'var(--muted)' : test.color, fontSize: 10, cursor: loading ? 'default' : 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
          {loading ? 'Running...' : 'Run'}
        </button>
      </div>
      <ResultBlock result={result} />
    </div>
  );
}

export default function TestPanel() {
  const [status, setStatus]   = useState(null);
  const [nominees, setNominees] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [alert, setAlert]     = useState(null);

  const loadStatus = async () => {
    try {
      const [ds, nm] = await Promise.all([deadmanAPI.getStatus(), nomineesAPI.getNominees()]);
      setStatus(ds.data.deadman);
      setNominees(nm.data.nominees);
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to load status. Make sure you are logged in.' });
    }
  };

  const loadAudit = async () => {
    setLoadingAudit(true);
    try {
      const r = await testAPI.getAuditLog();
      setAuditLog(r.data.logs);
    } catch { setAlert({ type: 'error', msg: 'Failed to load audit log.' }); }
    setLoadingAudit(false);
  };

  useEffect(() => { loadStatus(); }, []);

  const statusColor = () => {
    if (!status) return 'var(--muted)';
    if (status.triggered) return '#c45555';
    if (status.isOverdue) return '#c45555';
    if (status.daysUntilDue <= 5) return '#e8c96a';
    return '#4caf7d';
  };

  const badge = (label, color, bg) => (
    <span style={{ padding: '2px 8px', background: bg || `${color}18`, border: `1px solid ${color}55`, borderRadius: 2, fontSize: 9, color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {label}
    </span>
  );

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--bright)' }}>Test Panel</div>
          <span style={{ padding: '4px 10px', background: 'rgba(196,85,85,0.1)', border: '1px solid rgba(196,85,85,0.3)', borderRadius: 2, fontSize: 9, color: '#c45555', letterSpacing: '0.2em' }}>DEV ONLY</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', lineHeight: 1.6 }}>
          Simulate every scenario without waiting for real timers. Results show actual API responses.
        </div>
      </div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* Dead Man's Switch Status */}
        <div style={{ background: 'var(--card)', border: `1px solid ${statusColor()}`, borderRadius: 2, padding: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Dead Man's Switch</div>
          {status ? (
            <>
              <div style={{ fontSize: 26, fontFamily: "'Cormorant Garamond', serif", color: statusColor(), marginBottom: 12 }}>
                {status.triggered ? 'TRIGGERED' : status.isOverdue ? 'OVERDUE' : status.warningSent ? 'WARNING' : 'Active'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Days left', status.daysUntilDue],
                  ['Interval', `${status.checkIntervalDays}d`],
                  ['Misses', status.consecutiveMisses],
                  ['Warning sent', status.warningSent ? 'Yes' : 'No'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
                    <div style={{ fontSize: 14, color: 'var(--bright)' }}>{v}</div>
                  </div>
                ))}
              </div>
              {status.contestDeadline && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(232,169,48,0.08)', border: '1px solid rgba(232,169,48,0.3)', borderRadius: 2, fontSize: 10, color: '#e8c96a' }}>
                  ⏳ Contest window: {status.contestHoursLeft}h remaining
                </div>
              )}
              <button onClick={loadStatus} style={{ marginTop: 12, width: '100%', padding: '7px 0', background: 'transparent', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--muted)', fontSize: 9, cursor: 'pointer', letterSpacing: '0.1em' }}>
                ↻ Refresh
              </button>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</div>
          )}
        </div>

        {/* Nominees Status */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, padding: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Nominees</div>
          {nominees.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
              No nominees yet.<br />Add nominees in the Nominees page first.
            </div>
          ) : nominees.map(n => (
            <div key={n._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--bright)' }}>{n.fullName}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{n.email} · P{n.priorityLevel}</div>
              </div>
              {badge(n.status,
                n.status === 'accepted' ? '#4caf7d' : n.status === 'declined' ? '#c45555' : '#e8c96a'
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Test scenarios */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>
          Test Scenarios
        </div>
        {TESTS.map(t => <TestCard key={t.id} test={t} />)}
      </div>

      {/* Audit Log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Audit Log</div>
          <button onClick={loadAudit} disabled={loadingAudit}
            style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted)', fontSize: 9, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
            {loadingAudit ? 'Loading...' : 'Load Logs'}
          </button>
        </div>
        {auditLog.length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, maxHeight: 360, overflow: 'auto' }}>
            {auditLog.map((log, i) => (
              <div key={log._id || i} style={{ padding: '10px 16px', borderBottom: i < auditLog.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', minWidth: 130 }}>
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, color: log.severity === 'critical' ? '#c45555' : log.severity === 'warning' ? '#e8c96a' : '#4caf7d', fontFamily: 'monospace' }}>
                    {log.action}
                  </span>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 8 }}>
                      {JSON.stringify(log.metadata)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: 28, padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2 }}>
        <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Testing Guide</div>
        {[
          ['1. Add Nominees', 'Go to Nominees → add at least 1 nominee with a real email address → accept the invite.'],
          ['2. Simulate Warning', 'Run "Simulate Warning". Check your email + Dead Man\'s Switch page shows "WARNING SENT".'],
          ['3. Simulate Trigger', 'Run "Simulate Trigger". Nominee emails receive notifications. Contest window opens (72h).'],
          ['4. Test Check-in Cancel', 'While triggered, click "Confirm Check-in" on the Dead Man\'s Switch page — cancels the trigger.'],
          ['5. Test Nominee Flow', 'Run "Simulate Full Nominee Flow" — see all 4 steps: invite → trigger → priority → unlock email.'],
          ['6. Admin Panel', 'Go to /admin/login → submit a death request from /nominee-portal → approve in admin panel.'],
          ['7. Reset', 'After testing, run "Full Reset" to restore normal state.'],
        ].map(([step, desc]) => (
          <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', whiteSpace: 'nowrap', minWidth: 140, letterSpacing: '0.05em' }}>{step}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
