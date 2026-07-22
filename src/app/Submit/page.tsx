'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ISSUES = {
  software: [
    'Cannot log in to system/application',
    'Application crashing or freezing',
    'Software installation request',
    'Email not working (Outlook/Gmail)',
    'Slow computer performance',
    'VPN connection issues',
    'Microsoft Office errors',
    'Printer driver not working',
    'Browser issues (cannot access website)',
    'Password reset request',
    'System update/upgrade request',
    'Antivirus or security alert',
    'Other software issue',
  ],
  hardware: [
    'Computer not turning on',
    'Monitor not displaying / blank screen',
    'Keyboard or mouse not working',
    'Printer not printing',
    'Internet / network not connecting',
    'USB port not working',
    'Laptop battery not charging',
    'Computer running hot / overheating',
    'Hard drive or storage issue',
    'Headset or speaker not working',
    'Webcam not working',
    'Request for new equipment',
    'Other hardware issue',
  ],
}

function generateTicketNumber() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const yyyy = now.getFullYear()
  const rand = String(Math.floor(100 + Math.random() * 900))
  return `AOD-${mm}${dd}${yyyy}-${rand}`
}

export default function SubmitPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', category: '', issue_type: '', description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email.'
    if (!form.category) e.category = 'Please select a category.'
    if (!form.issue_type) e.issue_type = 'Please select an issue type.'
    if (!form.description.trim()) e.description = 'Please describe the issue.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setSubmitError('')
    const supabase = createClient()
    const tNum = generateTicketNumber()
    const fullDescription = `Ticket No: ${tNum}\nSubmitted by: ${form.full_name} (${form.email})\nCategory: ${form.category}\nIssue Type: ${form.issue_type}\n\n${form.description}`
    const { error } = await supabase.from('tickets').insert({
      title: `[${tNum}] ${form.issue_type}`,
      description: fullDescription,
      category: form.category,
      priority: 'medium',
      status: 'open',
    })
    setLoading(false)
    if (!error) {
  setTicketNumber(tNum)
  setSubmitted(true)
  // Fire and forget - don't await
  fetch('/api/push/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '🖥️ New IT Support Request',
      body: `${form.full_name} submitted: ${form.issue_type}`,
    }),
  }).catch(() => {})
}

  const field = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${hasError ? '#e24b4a' : '#d1d5db'}`,
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#111111',
    background: '#ffffff',
    fontFamily: 'sans-serif',
  })

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: '#111' }}>Ticket submitted!</h2>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '1rem', margin: '1rem 0' }}>
          <p style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>Your ticket number</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#15803d', letterSpacing: 1 }}>{ticketNumber}</p>
          <p style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>Save this for reference when following up.</p>
        </div>
        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>Our IT team will review your request and get back to you shortly.</p>
        <button onClick={() => { setSubmitted(false); setTicketNumber(''); setForm({ full_name: '', email: '', category: '', issue_type: '', description: '' }) }}
          style={{ padding: '10px 24px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#111' }}>
          Submit another ticket
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'sans-serif', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '2rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, color: '#111111' }}>🖥️ IT Helpdesk</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Submit a support request — no account needed.</p>

        {([
          { id: 'full_name', label: 'Full name', type: 'text', placeholder: 'e.g. Juan dela Cruz' },
          { id: 'email', label: 'Email address', type: 'email', placeholder: 'you@company.com' },
        ] as const).map(({ id, label, type, placeholder }) => (
          <div key={id} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              {label} <span style={{ color: '#e24b4a' }}>*</span>
            </label>
            <input type={type} placeholder={placeholder} value={form[id]}
              onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
              style={field(!!errors[id])} />
            {errors[id] && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 4 }}>{errors[id]}</p>}
          </div>
        ))}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
            Category <span style={{ color: '#e24b4a' }}>*</span>
          </label>
          <select value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value, issue_type: '' }))}
            style={field(!!errors.category)}>
            <option value=''>Select a category</option>
            <option value='software'>💻 Software</option>
            <option value='hardware'>🖨️ Hardware</option>
          </select>
          {errors.category && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 4 }}>{errors.category}</p>}
        </div>

        {form.category && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Issue type <span style={{ color: '#e24b4a' }}>*</span>
            </label>
            <select value={form.issue_type}
              onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))}
              style={field(!!errors.issue_type)}>
              <option value=''>Select an issue</option>
              {ISSUES[form.category as keyof typeof ISSUES].map(issue => (
                <option key={issue} value={issue}>{issue}</option>
              ))}
            </select>
            {errors.issue_type && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 4 }}>{errors.issue_type}</p>}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
            Additional details <span style={{ color: '#e24b4a' }}>*</span>
          </label>
          <textarea placeholder='Describe the issue in more detail — when it started, steps to reproduce, etc.'
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
            style={{ ...field(!!errors.description), resize: 'vertical' }} />
          {errors.description && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 4 }}>{errors.description}</p>}
        </div>

        {submitError && (
          <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: 13, color: '#991b1b' }}>
            {submitError}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#111111', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Submitting…' : 'Submit ticket'}
        </button>
      </div>
    </div>
  )
}