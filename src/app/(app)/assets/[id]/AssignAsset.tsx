'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Loader2 } from 'lucide-react'

export default function AssignAsset({ asset, employees }: { asset: any; employees: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState(asset.assigned_to || '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    setLoading(true)
    setMsg('')
    const updates: any = {
      assigned_to: userId || null,
      status: userId ? 'assigned' : 'available',
      assigned_at: userId ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('assets').update(updates).eq('id', asset.id)
    if (error) setMsg(error.message)
    else setMsg('Saved!')
    setLoading(false)
    router.refresh()
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Re-assign</p>
      <select className="select mb-3" value={userId} onChange={e => setUserId(e.target.value)}>
        <option value="">— Unassign —</option>
        {employees.map(e => (
          <option key={e.id} value={e.id}>{e.full_name}{e.department ? ` (${e.department})` : ''}</option>
        ))}
      </select>
      <button onClick={save} className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
        {userId ? 'Assign' : 'Unassign'}
      </button>
      {msg && <p className="text-xs mt-2 text-center" style={{ color: msg === 'Saved!' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{msg}</p>}
    </div>
  )
}
