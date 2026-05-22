'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewTicketPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'software',
    priority: 'medium',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { data, error: err } = await supabase
      .from('tickets')
      .insert({ ...form, submitted_by: user.id })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/helpdesk/${data.id}`)
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/helpdesk" className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Submit IT Ticket</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Describe your issue and our team will assist you</p>
        </div>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div>
          <label className="label">Issue Title *</label>
          <input
            className="input"
            placeholder="e.g. Cannot connect to company VPN"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            maxLength={150}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category *</label>
            <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
              {['hardware', 'software', 'network', 'account', 'email', 'printer', 'phone', 'other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority *</label>
            <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="low">🟢 Low — Minor inconvenience</option>
              <option value="medium">🟡 Medium — Affecting work</option>
              <option value="high">🟠 High — Blocking work</option>
              <option value="critical">🔴 Critical — System down</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            className="input resize-none"
            rows={6}
            placeholder="Please describe the issue in detail. Include:&#10;- What you were trying to do&#10;- What happened&#10;- Any error messages you saw&#10;- Steps to reproduce if possible"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/helpdesk" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Submit Ticket
          </button>
        </div>
      </form>
    </div>
  )
}
