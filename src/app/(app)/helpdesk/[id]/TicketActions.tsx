'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function TicketActions({ ticket, staffList }: { ticket: any; staffList: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function update(changes: Record<string, any>) {
    setLoading(true)
    const updates: any = { ...changes }
    if (changes.status === 'resolved' && !ticket.resolved_at) updates.resolved_at = new Date().toISOString()
    if (changes.status === 'closed' && !ticket.closed_at) updates.closed_at = new Date().toISOString()
    await supabase.from('tickets').update(updates).eq('id', ticket.id)
    setLoading(false)
    router.refresh()
  }

  const statusOptions = ['open', 'in_progress', 'waiting', 'resolved', 'closed']

  return (
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
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
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
          {staffList.map(s => (
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
  )
}