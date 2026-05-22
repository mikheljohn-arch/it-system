'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function UpdateUserRole({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  async function update() {
    setLoading(true)
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="select py-1 text-xs"
        style={{ width: 130 }}
        value={role}
        onChange={e => setRole(e.target.value)}
      >
        <option value="employee">Employee</option>
        <option value="it_staff">IT Staff</option>
        <option value="admin">Admin</option>
      </select>
      {role !== currentRole && (
        <button onClick={update} className="btn-primary py-1 px-2 text-xs" disabled={loading}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
        </button>
      )}
    </div>
  )
}
