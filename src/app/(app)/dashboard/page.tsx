import { createClient } from '@/lib/supabase/server'
import { Ticket, Monitor, Key, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isStaff = profile?.role === 'it_staff' || profile?.role === 'admin'

  const [ticketsRes, assetsRes, licensesRes, recentTicketsRes, queueRes] = await Promise.all([
    supabase.from('tickets').select('status, priority', { count: 'exact' }),
    isStaff ? supabase.from('assets').select('status', { count: 'exact' }) : Promise.resolve({ data: [], count: 0, error: null }),
    isStaff ? supabase.from('software_licenses').select('status, renewal_date', { count: 'exact' }) : Promise.resolve({ data: [], count: 0, error: null }),
    supabase.from('tickets')
      .select('*, submitter:submitted_by(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('tickets')
      .select('*, submitter:submitted_by(full_name)')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: true }),
  ])

  const tickets = ticketsRes.data || []
  const assets = assetsRes.data || []
  const licenses = licensesRes.data || []
  const recentTickets = recentTicketsRes.data || []
  const queue = queueRes.data || []

  const openTickets = tickets.filter(t => t.status === 'open').length
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length
  const criticalTickets = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').length
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
    const d = new Date(ticket.created_at)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    const seq = String(ticket.ticket_number).padStart(3, '0')
    return `AOD-${mm}${dd}${yyyy}-${seq}`
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
              <AlertTriangle size={20} style={{ color: '