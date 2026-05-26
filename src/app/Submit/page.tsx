'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SubmitPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', department: '', title: '', description: '', priority: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email.'
    if (!form.department) e.department = 'Please select your department.'
    if (!form.title.trim()) e.title = 'Please enter an issue title.'
    if (!form.description.trim()) e.description = 'Please describe the issue.'
    if (!form.priority) e.priority = 'Please select a priority.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()
    const fullDescription = `Submitted by: ${form.full_name} (${form.email})\nDepartment: ${form.department}\n\n${form.description}`
    const { error } = await supabase.from('tickets').insert({
      title: form.title,
      description: fullDescription,
      category: 'software',
      priority: form.priority.toLowerCase(),
      status: 'open',
    })
    setLoading(false)
    if (!error) setSubmitted(true)
    else alert('Something went wrong. Please try again.')
  }

  const priorities = [
    { label: 'Low', color: '#0F6E56', bg: '#E1F5EE', border: '#1D9E75' },
    { label: 'Medium', color: '#854F0B', bg: '#FAEEDA', border: '#BA7517' },
    { label: 'High', color: '#993C1D', bg: '#FAECE7', border: '#D85A30' },
    { label: 'Critical', color: '#791F1F', bg: '#FCEBEB', border: '#A32D2D' },
  ]

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
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: '#111' }}>Ticket submitted!</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Your IT support request has been received. We'll get back to you shortly.</p>
        <button onClick={() => { setSubmitted(false); setForm({ full_name: '', email: '', department: '', title: '', description: '', priority: '' }) }}
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
          { id: 'title', label: 'Issue title', type: 'text', placeholder: 'Brief summary of the problem' },
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
            Department <span style={{ color: '#e24b4a' }}>*</span>
          </label>
          <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            style={field(!!errors.department)}>
            <option value=''>Select your department</option>
            {['Administration', 'Finance', 'Human Resources', 'IT', 'Operations', 'Sales & Marketing', 'Other'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.department && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 4 }}>{errors.department}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
            Issue description <span style={{ color: '#e24b4a' }}>*</span>
          </label>
          <textarea placeholder='Describe the issue in detail...' value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
            style={{ ...field(!!errors.description), resize: 'vertical' }} />
          {errors.description && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 4 }}>{errors.description}</p>}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
            Priority <span style={{ color: '#e24b4a' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {priorities.map(({ label, color, bg, border }) => (
              <button key={label} onClick={() => setForm(f => ({ ...f, priority: label }))}
                style={{ padding: '10px 4px', borderRadius: '8px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${form.priority === label ? border : '#d1d5db'}`,
                  background: form.priority === label ? bg : '#ffffff',
                  color: form.priority === label ? color : '#374151' }}>
                {label}
              </button>
            ))}
          </div>
          {errors.priority && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 4 }}>{errors.priority}</p>}
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#111111', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Submitting…' : 'Submit ticket'}
        </button>
      </div>
    </div>
  )
}