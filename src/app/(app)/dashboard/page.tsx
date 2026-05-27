import { createClient } from '@/lib/supabase/server'
import { Ticket, Monitor, Key, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import TimeGreeting from './TimeGreeting'
import RelativeTime from './RelativeTime'
import AutoRefresh from './AutoRefresh'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const isStaff = profile?.role === 'it_staff' || profile?.role === 'admin'

  const [ticketsRes, assetsRes, licensesRes, recentTicketsRes, queueRes, doneRes] = await Promise.all([
    supabase.from('tickets').select('status, priority', { count: 'exact' }),
    isStaff ? supabase.from('assets').select('status', { count: 'exact' }) : Promise.resolve({ data: [], count: 0, error: null }),
    isStaff ? supabase.from('software_licenses').select('status, renewal_date', { count: 'exact' }) : Promise.resolve({ data: [], count: 0, error: null }),
    supabase.from('tickets').select('*, submitter:submitted_by(full_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('tickets').select('*, submitter:submitted_by(full_name)').in('status', ['open', 'in_progress']).order('created_at', { ascending: true }),
    supabase.from('tickets').select('*, submitter:submitted_by(full_name)').in('status', ['resolved', 'closed']).order('updated_at', { ascending: false }).limit(10),
  ])

  const tickets = ticketsRes.data || []
  const assets = assetsRes.data || []
  const licenses = licensesRes.data || []
  const recentTickets = recentTicketsRes.data || []
  const queue = queueRes.data || []
  const done = doneRes.data || []

  const openTickets = tickets.filter((t: any) => t.status === 'open').length
  const inProgressTickets = tickets.filter((t: any) => t.status === 'in_progress').length
  const criticalTickets = tickets.filter((t: any) => t.priority === 'critical' && t.status !== 'closed').length
  const availableAssets = assets.filter((a: any) => a.status === 'available').length
  const assignedAssets = assets.filter((a: any) => a.status === 'assigned').length
  const expiringLicenses = licenses.filter((l: any) => {
    if (!l.renewal_date) return false
    const days = (new Date(l.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 30 && days >= 0
  }).length

  const statusColor: Record<string, string> = {
    open: 'var(--accent-blue)',
    in_progress: 'var(--accent-amber)',
    waiting: '#a78bfa',
    resolved: 'var(--accent-green)',
    closed: 'var(--text-muted)',
  }

  const priorityLabel: Record<string, string> = {
    low: '🟢 Low',
    medium: '🟡 Medium',
    high: '🟠 High',
    critical: '🔴 Critical',
  }

  function getAODNumber(ticket: any) {
    const match = ticket.title?.match(/\[?(AOD-\d{8}-\d+)\]?/)
    if (match) return match[1]
    const d = new Date(ticket.created_at)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    const seq = String(ticket.ticket_number).padStart(3, '0')
    return `AOD-${mm}${dd}${yyyy}-${seq}`
  }

  function TicketTable({ rows, showQueue }: { rows: any[], showQueue: boolean }) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[showQueue ? 'Queue' : 'Order', 'Tracking No.', 'Issue', 'Requested by', showQueue ? 'Submitted' : 'Resolved', 'Priority', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((ticket: any, index: number) => (
              <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>#{index + 1}</td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <Link href={`/helpdesk/${ticket.id}`} style={{ color: 'var(--accent-blue)', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {getAODNumber(ticket)}
                  </Link>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-primary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ticket.title.replace(/^\[AOD-[^\]]+\]\s*/, '')}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {ticket.submitter?.full_name || '—'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                  <RelativeTime date={showQueue ? ticket.created_at : (ticket.updated_at || ticket.created_at)} />
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {priorityLabel[ticket.priority]}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span className={`badge status-${ticket.status}`} style={{ fontSize: 11 }}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <AutoRefresh intervalSeconds={30} />

      <div>
        <TimeGreeting name={profile?.full_name.split(' ')[0] || ''} />
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Here's what's happening across IT today.</p>
      </div>

      {!isStaff && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Need IT help?</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Raise a support ticket and our IT team will assist you.</p>
          </div>
          <Link href="/helpdesk/new" className="btn-primary flex-shrink-0">
            <Ticket size={15} /> Submit Ticket
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="icon-box" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Ticket size={20} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{openTickets}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Open Tickets</p>
            {inProgressTickets > 0 && <p className="text-xs mt-0.5" style={{ color: 'var(--accent-amber)' }}>{inProgressTickets} in progress</p>}
          </div>
        </div>

        {criticalTickets > 0 && (
          <div className="stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
            <div className="icon-box" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--accent-red)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-red)' }}>{criticalTickets}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Critical Issues</p>
            </div>
          </div>
        )}

        {isStaff && (
          <>
            <div className="stat-card">
              <div className="icon-box" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Monitor size={20} style={{ color: 'var(--accent-green)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{availableAssets}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Available Assets</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{assignedAssets} assigned</p>
              </div>
            </div>
            <div className="stat-card" style={expiringLicenses > 0 ? { borderColor: 'rgba(245,158,11,0.3)' } : {}}>
              <div className="icon-box" style={{ background: expiringLicenses > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)' }}>
                <Key size={20} style={{ color: expiringLicenses > 0 ? 'var(--accent-amber)' : 'var(--accent-purple)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: expiringLicenses > 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{expiringLicenses}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Expiring (30d)</p>
              </div>
            </div>
          </>
        )}

        <div className="stat-card">
          <div className="icon-box" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <CheckCircle size={20} style={{ color: 'var(--accent-green)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {tickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resolved</p>
          </div>
        </div>
      </div>

      {isStaff && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: 'var(--accent-blue)' }} />
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Pending Queue</h2>
                <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', fontSize: 11 }}>{queue.length} pending</span>
              </div>
              <Link href="/helpdesk" className="text-xs hover:underline" style={{ color: 'var(--accent-blue)' }}>View all →</Link>
            </div>
            {queue.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--accent-green)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All caught up! No pending tickets.</p>
              </div>
            ) : <TicketTable rows={queue} showQueue={true} />}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Completed</h2>
                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', fontSize: 11 }}>{done.length} resolved</span>
              </div>
              <Link href="/helpdesk" className="text-xs hover:underline" style={{ color: 'var(--accent-blue)' }}>View all →</Link>
            </div>
            {done.length === 0 ? (
              <div className="text-center py-8">
                <Ticket size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No completed tickets yet.</p>
              </div>
            ) : <TicketTable rows={done} showQueue={false} />}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Tickets</h2>
          <Link href="/helpdesk" className="text-xs hover:underline" style={{ color: 'var(--accent-blue)' }}>View all →</Link>
        </div>
        {recentTickets.length === 0 ? (
          <div className="text-center py-8">
            <Ticket size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tickets yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentTickets.map((ticket: any) => (
              <Link key={ticket.id} href={`/helpdesk/${ticket.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg table-row-hover group">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor[ticket.status] }} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{getAODNumber(ticket)}</span>{' '}
                    {ticket.title.replace(/^\[AOD-[^\]]+\]\s*/, '')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {ticket.submitter?.full_name || 'Unknown'} · <RelativeTime date={ticket.created_at} />
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="badge" style={{ background: 'var(--bg-hover)', fontSize: '11px', color: 'var(--text-muted)' }}>{priorityLabel[ticket.priority]}</span>
                  <span className={`badge status-${ticket.status}`} style={{ fontSize: '11px' }}>{ticket.status.replace('_', ' ')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}