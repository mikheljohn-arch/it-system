import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import TicketActions from './TicketActions'
import AddComment from './AddComment'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isStaff = profile?.role === 'it_staff' || profile?.role === 'admin'

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, submitter:submitted_by(*), assignee:assigned_to(*)')
    .eq('id', params.id)
    .single()

  if (!ticket) notFound()

  const { data: comments } = await supabase
    .from('ticket_comments')
    .select('*, author_profile:author(*)')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true })

  const { data: staffList } = isStaff
    ? await supabase.from('profiles').select('id, full_name').in('role', ['it_staff', 'admin'])
    : { data: [] }

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/helpdesk" className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>#{ticket.ticket_number}</span>
            <span className={`badge status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
            <span className={`text-xs font-medium priority-${ticket.priority}`}>{ticket.priority}</span>
          </div>
          <h1 className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{ticket.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main content */}
        <div className="col-span-2 space-y-4">
          {/* Description */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'var(--accent-blue)', color: 'white' }}>
                {ticket.submitter?.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.submitter?.full_name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {ticket.description}
            </p>
          </div>

          {/* Comments */}
          {comments && comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment.id} className="card" style={comment.is_internal ? { borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' } : {}}>
                  {comment.is_internal && (
                    <p className="text-xs mb-2 font-medium" style={{ color: 'var(--accent-amber)' }}>🔒 Internal note</p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)' }}>
                      {comment.author_profile?.full_name?.charAt(0) || '?'}
                    </div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{comment.author_profile?.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(comment.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <AddComment ticketId={ticket.id} isStaff={isStaff} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Details</p>
            {[
              ['Category', ticket.category],
              ['Priority', ticket.priority],
              ['Status', ticket.status.replace('_', ' ')],
              ['Assigned to', ticket.assignee?.full_name || 'Unassigned'],
              ['Submitted by', ticket.submitter?.full_name],
              ['Department', ticket.submitter?.department || '—'],
              ['Created', format(new Date(ticket.created_at), 'MMM d, yyyy')],
              ticket.resolved_at ? ['Resolved', format(new Date(ticket.resolved_at), 'MMM d, yyyy')] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label as string} className="flex justify-between items-start gap-2">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-xs font-medium text-right capitalize" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>

          {isStaff && (
            <TicketActions ticket={ticket} staffList={staffList || []} />
          )}
        </div>
      </div>
    </div>
  )
}
