import { createClient } from '@/lib/supabase/server'
import { Ticket, Monitor, Key, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isStaff = profile?.role === 'it_staff' || profile?.role === 'admin'

  // Fetch stats
  const [ticketsRes, assetsRes, licensesRes, recentTicketsRes] = await Promise.all([
    supabase.from('tickets').select('status, priority', { count: 'exact' }),
    isStaff ? supabase.from('assets').select('status', { count: 'exact' }) : Promise.resolve({ data: [], count: 0, error: null }),
    isStaff ? supabase.from('software_licenses').select('status, renewal_date', { count: 'exact' }) : Promise.resolve({ data: [], count: 0, error: null }),
    supabase.from('tickets')
      .select('*, submitter:submitted_by(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const tickets = ticketsRes.data || []
  const assets = assetsRes.data || []
  const licenses = licensesRes.data || []
  const recentTickets = recentTicketsRes.data || []

  const openTickets = tickets.filter(t => t.status === 'open').length
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length
  const criticalTickets = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').length
  const availableAssets = assets.filter(a => a.status === 'available').length
  const assignedAssets = assets.filter(a => a.status === 'assigned').length
  const expiringLicenses = licenses.filter(l => {
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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Here's what's happening across IT today.
        </p>
      </div>

      {/* Quick action for employees */}
      {!isStaff && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Need IT help?</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Raise a support ticket and our IT team will assist you.</p>
          </div>
          <Link href="/helpdesk/new" className="btn-primary flex-shrink-0">
            <Ticket size={15} />
            Submit Ticket
          </Link>
        </div>
      )}

      {/* Stats grid */}
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
              {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resolved</p>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
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
                    #{ticket.ticket_number} {ticket.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {ticket.submitter?.full_name} · {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="badge" style={{ background: 'var(--bg-hover)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {priorityLabel[ticket.priority]}
                  </span>
                  <span className={`badge status-${ticket.status}`} style={{ fontSize: '11px' }}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
