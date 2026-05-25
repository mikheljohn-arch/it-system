'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteTicket({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function deleteTicket() {
    setLoading(true)
    await supabase.from('ticket_comments').delete().eq('ticket_id', ticketId)
    await supabase.from('tickets').delete().eq('id', ticketId)
    router.push('/helpdesk')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--accent-red)' }}>Are you sure? This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={deleteTicket} className="btn-primary flex-1 justify-center" style={{ background: 'var(--accent-red)' }} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Yes, Delete
          </button>
          <button onClick={() => setConfirm(false)} className="btn-secondary flex-1 justify-center" disabled={loading}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)} className="btn-secondary w-full justify-center" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
      <Trash2 size={14} />
      Delete Ticket
    </button>
  )
}