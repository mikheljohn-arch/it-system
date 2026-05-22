import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Ticket } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default async function HelpdeskPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const isStaff = profile?.role === 'it_staff' || profile?.role === 'admin'

  let query = supabase
    .from('tickets')
    .select('*, submitter:submitted_by(full_name, email), assignee:assigned_to(full_name)')
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.priority) query = query.eq('priority', searchParams.priority)

  const { data: tickets } = await query

  const statusTabs = [
    { key: '', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'waiting', label: 'Waiting' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ]

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>IT Helpdesk</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isStaff ? 'Manage all support tickets' : 'Your submitted tickets'}
          </p>
        </div>
        <Link href="/helpdesk/new" className="btn-primary">
          <Plus size={16} />
          New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map(tab => (
          <Link
            key={tab.key}
            href={`/helpdesk${tab.key ? `?status=${tab.key}` : ''}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={
              (searchParams.status || '') === tab.key
                ? { background: 'var(--accent-blue)', color: 'white' }
                : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Ticket list */}
      <div className="card p-0 overflow-hidden">
        {!tickets || tickets.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No tickets found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {isStaff ? 'No tickets match your filter.' : 'Submit your first ticket to get IT support.'}
            </p>
            <Link href="/helpdesk/new" className="btn-primary inline-flex mt-4">
              <Plus size={15} />
              Submit a Ticket
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Title', 'Category', 'Priority', 'Status', isStaff ? 'Submitted By' : 'Assigned To', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: any) => (
                <tr key={ticket.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>#{ticket.ticket_number}</td>
                  <td className="px-4 py-3">
                    <Link href={`/helpdesk/${ticket.id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {ticket.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium priority-${ticket.priority}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge status-${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {isStaff ? ticket.submitter?.full_name : ticket.assignee?.full_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
