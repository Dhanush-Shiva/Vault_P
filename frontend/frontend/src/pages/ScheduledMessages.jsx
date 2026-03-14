import { useState, useEffect } from 'react';
import { messagesAPI } from '../utils/api';
import { Alert, PrimaryButton } from '../components/UI';

const empty = { title: '', message: '', recipientName: '', recipientEmail: '' };

export default function ScheduledMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(empty);
  const [editing, setEditing]   = useState(null); // id being edited
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try { const r = await messagesAPI.getMessages(); setMessages(r.data.messages); }
    catch { setAlert({ type: 'error', msg: 'Failed to load messages.' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.message || !form.recipientEmail) {
      return setAlert({ type: 'error', msg: 'Title, message, and recipient email are required.' });
    }
    setSaving(true); setAlert(null);
    try {
      if (editing) {
        await messagesAPI.updateMessage(editing, form);
        setAlert({ type: 'success', msg: 'Message updated.' });
      } else {
        await messagesAPI.createMessage(form);
        setAlert({ type: 'success', msg: 'Message saved. It will be delivered when your vault is unlocked.' });
      }
      setForm(empty); setEditing(null); setShowForm(false); await load();
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to save.' });
    }
    setSaving(false);
  };

  const handleEdit = (msg) => {
    setForm({ title: msg.title, message: msg.message, recipientName: msg.recipientName, recipientEmail: msg.recipientEmail });
    setEditing(msg._id); setShowForm(true); setAlert(null);
    setTimeout(() => document.getElementById('msg-title')?.focus(), 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try { await messagesAPI.deleteMessage(id); await load(); setAlert({ type: 'success', msg: 'Deleted.' }); }
    catch { setAlert({ type: 'error', msg: 'Failed to delete.' }); }
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 2, padding: '10px 12px', fontSize: 13, color: 'var(--bright)',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--bright)' }}>
            Scheduled Messages
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.08em', lineHeight: 1.6 }}>
            Write personal messages to loved ones — delivered automatically when your vault is unlocked.
          </div>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
            style={{ padding: '10px 20px', background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold)', borderRadius: 2, color: 'var(--gold)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            + New Message
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      {/* Compose / Edit form */}
      {showForm && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 2, padding: 28, marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
            {editing ? 'Edit Message' : 'Compose Message'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Recipient Name</label>
              <input id="msg-recip-name" style={inputStyle} placeholder="e.g. Sarah" value={form.recipientName}
                onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Recipient Email *</label>
              <input type="email" style={inputStyle} placeholder="recipient@email.com" value={form.recipientEmail}
                onChange={e => setForm(f => ({ ...f, recipientEmail: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Subject / Title *</label>
            <input id="msg-title" style={inputStyle} placeholder="e.g. To my daughter on her wedding day" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
              Message * <span style={{ color: 'var(--muted)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>({form.message.length}/5000)</span>
            </label>
            <textarea style={{ ...inputStyle, minHeight: 160, resize: 'vertical', lineHeight: 1.7 }}
              placeholder="Write your personal message here..." value={form.message} maxLength={5000}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <PrimaryButton onClick={handleSave} loading={saving} loadingText="Saving...">
              {editing ? '✓ Update Message' : '✓ Save Message'}
            </PrimaryButton>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); setAlert(null); }}
              style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--muted)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: 2 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--bright)', marginBottom: 8 }}>No messages yet</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
            Create personal messages to be delivered to your loved ones<br />when your vault is unlocked after death verification.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''} — delivered on vault unlock
          </div>
          {messages.map(msg => (
            <div key={msg._id} style={{ background: 'var(--card)', border: `1px solid ${msg.isDelivered ? 'rgba(76,175,125,0.3)' : 'var(--border)'}`, borderRadius: 2, padding: '18px 20px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--bright)', marginBottom: 4, fontWeight: 500 }}>{msg.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                    To: <span style={{ color: 'var(--text)' }}>{msg.recipientName || msg.recipientEmail}</span>
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                    {msg.recipientEmail}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, maxHeight: 40, overflow: 'hidden' }}>
                    {msg.message.slice(0, 120)}{msg.message.length > 120 ? '...' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
                  {msg.isDelivered ? (
                    <span style={{ padding: '3px 10px', background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 2, fontSize: 9, color: '#4caf7d', letterSpacing: '0.12em' }}>DELIVERED</span>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(msg)}
                        style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted)', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(msg._id)}
                        style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(196,85,85,0.3)', borderRadius: 2, color: '#c45555', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em' }}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
