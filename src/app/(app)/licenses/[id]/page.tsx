import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Key } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default async function LicenseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role === 'employee') redirect('/dashboard')

  const { data: license } = await supabase.from('software_licenses').select('*').eq('id', params.id).single()
  if (!license) notFound()

  const { data: assignments } = await supabase
    .from('license_assignments')
    .select('*, user:user_id(full_name, email, department)')
    .eq('license_id', params.id)

  const daysLeft = license.renewal_date
    ? differenceInDays(new Date(license.renewal_date), new Date())
    : null

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/licenses" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`badge status-${license.status}`}>{license.status}</span>
            <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{license.category}</span>
          </div>
          <h1 className="text-xl font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{license.name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{license.vendor}</p>
        </div>
        <Link href={`/licenses/${license.id}/edit`} className="btn-secondary">
          <Edit size={15} />
          Edit
        </Link>
      </div>

      {/* Renewal alert */}
      {daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 && (
        <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--accent-amber)' }}>⚠️ Renewal in {daysLeft} days</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Renewal due: {format(new Date(license.renewal_date!), 'MMMM d, yyyy')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {/* Details */}
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>License Details</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ['License Type', license.license_type?.replace('_', ' ')],
                ['Billing Cycle', license.billing_cycle || '—'],
                ['Total Seats', license.total_seats?.toString() || 'Unlimited'],
                ['Used Seats', license.used_seats?.toString() || '0'],
                ['Cost/Seat', license.cost_per_seat ? `₱${Number(license.cost_per_seat).toLocaleString()}` : '—'],
                ['Total Cost', license.total_cost ? `₱${Number(license.total_cost).toLocaleString()}` : '—'],
                ['Purchase Date', license.purchase_date ? format(new Date(license.purchase_date), 'MMM d, yyyy') : '—'],
                ['Renewal Date', license.renewal_date ? format(new Date(license.renewal_date), 'MMM d, yyyy') : '—'],
                ['Vendor Contact', license.vendor_contact || '—'],
                ['Vendor Email', license.vendor_email || '—'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-sm font-medium mt-0.5 capitalize" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Seat usage */}
          {license.total_seats && (
            <div className="card">
              <div className="flex justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Seat Usage</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{license.used_seats} / {license.total_seats} used</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (license.used_seats / license.total_seats) * 100)}%`,
                    background: license.used_seats / license.total_seats > 0.9 ? 'var(--accent-red)' : 'var(--accent-blue)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Assigned users */}
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Assigned Users ({assignments?.length || 0})
            </p>
            {!assignments || assignments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users assigned yet</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'var(--accent-blue)', color: 'white' }}>
                      {a.user?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.user?.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.user?.department || a.user?.email}</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(a.assigned_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key info card */}
        <div className="space-y-4">
          {license.license_key && (
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>License Key</p>
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <Key size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <p className="text-xs font-mono break-all" style={{ color: 'var(--text-secondary)' }}>{license.license_key}</p>
              </div>
            </div>
          )}
          {license.notes && (
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{license.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
