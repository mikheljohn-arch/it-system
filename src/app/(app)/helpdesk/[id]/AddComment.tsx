'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'

export default function AddComment({ ticketId, isStaff }: { ticketId: string; isStaff: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('ticket_comments').insert({
      ticket_id: ticketId,
      author: user!.id,
      content: content.trim(),
      is_internal: isInternal && isStaff,
    })

    setContent('')
    setIsInternal(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card">
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Add a comment</p>
      <textarea
        className="input resize-none mb-3"
        rows={3}
        placeholder={isStaff ? "Update, ask for more info, or provide a resolution..." : "Add more details or follow up..."}
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <div className="flex items-center justify-between">
        {isStaff && (
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={e => setIsInternal(e.target.checked)}
              className="rounded"
            />
            Internal note (hidden from employee)
          </label>
        )}
        {!isStaff && <div />}
        <button type="submit" className="btn-primary" disabled={loading || !content.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </div>
    </form>
  )
}
