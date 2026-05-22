import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Key, Plus, AlertTriangle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default async function LicensesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role === 'employee') redirect('/dashboard')

  const { data: licenses } = await supabase
    .from('software_licenses')
    .select('*')
    .order('name')

  const totalCost = licenses?.reduce((sum, l) => sum + (l.total_cost || 0), 0) || 0
  const expiringSoon = licenses?.filter(l => {
    if (!l.renewal_date) return false
    const days = differenceInDays(new Date(l.renewal_date), new Date())
    return days >= 0 && days <= 30
  }) || []

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Software & Licenses</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Track subscriptions, costs, and renewal dates</p>
        </div>
        <Link href="/licenses/new" className="btn-primary">
          <Plus size={16} />
          Add License
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Licenses', value: licenses?.length || 0, color: 'var(--accent-blue)' },
          { label: 'Active', value: licenses?.filter(l => l.status === 'active').length || 0, color: 'var(--accent-green)' },
          { label: 'Expiring (30d)', value: expiringSoon.length, color: expiringSoon.length > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' },
          { label: 'Annual Cost', value: `₱${totalCost.toLocaleString()}`, color: 'var(--accent-purple)' },
        ].map(s => (
          <div key={s.label} className="card py-3">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Licenses expiring soon</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {expiringSoon.map(l => l.name).join(', ')} — renew before the deadline to avoid disruption.
            </p>
          </div>
        </div>
      )}

      {/* License grid */}
      {!licenses || licenses.length === 0 ? (
        <div className="card text-center py-16">
          <Key size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No licenses tracked yet</p>
          <Link href="/licenses/new" className="btn-primary inline-flex mt-4">
            <Plus size={15} />
            Add First License
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {licenses.map((license: any) => {
            const daysLeft = license.renewal_date
              ? differenceInDays(new Date(license.renewal_date), new Date())
              : null
            const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30
            const isExpired = daysLeft !== null && daysLeft < 0

            return (
              <Link key={license.id} href={`/licenses/${license.id}`} className="card hover:border-blue-500/30 transition-colors block">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{license.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{license.vendor}</p>
                  </div>
                  <span className={`badge status-${license.status}`}>{license.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Seats</p>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {license.used_seats}/{license.total_seats || '∞'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Cost</p>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {license.total_cost ? `₱${Number(license.total_cost).toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Renewal</p>
                    <p className="font-medium mt-0.5" style={{
                      color: isExpired ? 'var(--accent-red)' : isExpiring ? 'var(--accent-amber)' : 'var(--text-primary)'
                    }}>
                      {license.renewal_date ? format(new Date(license.renewal_date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                </div>

                {isExpiring && (
                  <div className="mt-3 text-xs rounded-lg px-2 py-1" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)' }}>
                    ⚠️ Renews in {daysLeft} days
                  </div>
                )}
                {isExpired && (
                  <div className="mt-3 text-xs rounded-lg px-2 py-1" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)' }}>
                    ❌ Expired {Math.abs(daysLeft!)} days ago
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
