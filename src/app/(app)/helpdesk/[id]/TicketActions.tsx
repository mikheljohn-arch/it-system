'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

export default function TicketActions({ ticket, staffList }: { ticket: any; staffList: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [resolution, setResolution] = useState(ticket.resolution || '')
  const [saved, setSaved] = useState(false)

  async function update(changes: Record<string, any>) {
    setLoading(true)
    const updates: any = { ...changes }
    if (changes.status === 'resolved' && !ticket.resolved_at) updates.resolved_at = new Date().toISOString()
    if (changes.status === 'closed' && !ticket.closed_at) updates.closed_at = new Date().toISOString()
    await supabase.from('tickets').update(updates).eq('id', ticket.id)
    setLoading(false)
    router.refresh()
  }

  async function saveResolution() {
    setLoading(true)
    await supabase.from('tickets').update({
      resolution,
      status: 'resolved',
      resolved_at: new Date().toISOString()
    }).eq('id', ticket.id)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  const statusOptions = ['open', 'in_progress', 'waiting', 'resolved', 'closed']

  return (
    <div className="space-y-3">
      <div className="card space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>IT Actions</p>

        <div>
          <label className="label">Change Status</label>
          <select
            className="select"
            value={ticket.status}
            onChange={e => update({ status: e.target.value })}
            disabled={loading}
          >
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Assign To</label>
          <select
            className="select"
            value={ticket.assigned_to || ''}
            onChange={e => update({ assigned_to: e.target.value || null })}
            disabled={loading}
          >
            <option value="">Unassigned</option>
            {staffList.map((s: any) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Priority</label>
          <select
            className="select"
            value={ticket.priority}
            onChange={e => update({ priority: e.target.value })}
            disabled={loading}
          >
            {['low', 'medium', 'high', 'critical'].map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={12} className="animate-spin" /> Saving...
          </div>
        )}
      </div>

      {/* Resolution Box */}
      <div className="card space-y-3" style={ticket.resolution ? { borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' } : {}}>
        <div className="flex items-center gap-2">
          <CheckCircle size={14} style={{ color: ticket.resolution ? 'var(--accent-green)' : 'var(--text-muted)' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ticket.resolution ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {ticket.resolution ? 'Resolution' : 'Mark as Resolved'}
          </p>
        </div>

        {ticket.resolution && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {ticket.resolution}
          </div>
        )}

        <textarea
          className="input resize-none text-sm"
          rows={3}
          placeholder="Describe how this issue was resolved..."
          value={resolution}
          onChange={e => setResolution(e.target.value)}
        />

        <button
          onClick={saveResolution}
          className="btn-primary w-full justify-center"
          style={{ background: 'var(--accent-green)' }}
          disabled={loading || !resolution.trim()}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          {saved ? 'Saved!' : 'Mark as Resolved'}
        </button>
      </div>
    </div>
  )
}