import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Monitor, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const CATEGORY_ICONS: Record<string, string> = {
  laptop: '💻', desktop: '🖥️', monitor: '🖥', keyboard: '⌨️',
  mouse: '🖱️', printer: '🖨️', phone: '📱', tablet: '📱',
  server: '🖥️', network: '🌐', peripheral: '🔌', other: '📦'
}

export default async function AssetsPage({ searchParams }: { searchParams: { status?: string; category?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role === 'employee') redirect('/dashboard')

  let query = supabase
    .from('assets')
    .select('*, assigned_user:assigned_to(full_name, email, department)')
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.category) query = query.eq('category', searchParams.category)

  const { data: assets } = await query

  const statusTabs = [
    { key: '', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'under_repair', label: 'Under Repair' },
    { key: 'retired', label: 'Retired' },
  ]

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Asset Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage devices, peripherals, and assignments</p>
        </div>
        <Link href="/assets/new" className="btn-primary">
          <Plus size={16} />
          Add Asset
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', count: assets?.length || 0, color: 'var(--accent-blue)' },
          { label: 'Available', count: assets?.filter(a => a.status === 'available').length || 0, color: 'var(--accent-green)' },
          { label: 'Assigned', count: assets?.filter(a => a.status === 'assigned').length || 0, color: 'var(--accent-blue)' },
          { label: 'Under Repair', count: assets?.filter(a => a.status === 'under_repair').length || 0, color: 'var(--accent-amber)' },
        ].map(s => (
          <div key={s.label} className="card py-3">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map(tab => (
          <Link
            key={tab.key}
            href={`/assets${tab.key ? `?status=${tab.key}` : ''}`}
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {!assets || assets.length === 0 ? (
          <div className="text-center py-16">
            <Monitor size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No assets found</p>
            <Link href="/assets/new" className="btn-primary inline-flex mt-4">
              <Plus size={15} />
              Add First Asset
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Asset Tag', 'Name', 'Category', 'Status', 'Assigned To', 'Location', 'Warranty'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset: any) => (
                <tr key={asset.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <Link href={`/assets/${asset.id}`} className="text-xs font-mono font-medium hover:underline" style={{ color: 'var(--accent-blue)' }}>
                      {asset.asset_tag}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {CATEGORY_ICONS[asset.category]} {asset.name}
                      </p>
                      {asset.brand && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{asset.brand} {asset.model}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge status-${asset.status}`}>{asset.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {asset.assigned_user?.full_name || '—'}
                    {asset.assigned_user?.department && <span style={{ color: 'var(--text-muted)' }}> · {asset.assigned_user.department}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{asset.location || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {asset.warranty_expiry ? (
                      <span style={{ color: new Date(asset.warranty_expiry) < new Date() ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {new Date(asset.warranty_expiry) < new Date() ? 'Expired' : formatDistanceToNow(new Date(asset.warranty_expiry), { addSuffix: true })}
                      </span>
                    ) : '—'}
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
