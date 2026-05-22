import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { format } from 'date-fns'
import AssignAsset from './AssignAsset'

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role === 'employee') redirect('/dashboard')

  const { data: asset } = await supabase
    .from('assets')
    .select('*, assigned_user:assigned_to(*)')
    .eq('id', params.id)
    .single()

  if (!asset) notFound()

  const { data: employees } = await supabase.from('profiles').select('id, full_name, email, department').order('full_name')

  const fields = [
    ['Asset Tag', asset.asset_tag],
    ['Category', asset.category],
    ['Brand', asset.brand || '—'],
    ['Model', asset.model || '—'],
    ['Serial Number', asset.serial_number || '—'],
    ['Condition', asset.condition],
    ['Location', asset.location || '—'],
    ['Purchase Date', asset.purchase_date ? format(new Date(asset.purchase_date), 'MMM d, yyyy') : '—'],
    ['Purchase Cost', asset.purchase_cost ? `₱${Number(asset.purchase_cost).toLocaleString()}` : '—'],
    ['Warranty Expiry', asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'MMM d, yyyy') : '—'],
    ['Added', format(new Date(asset.created_at), 'MMM d, yyyy')],
  ]

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assets" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{asset.asset_tag}</span>
            <span className={`badge status-${asset.status}`}>{asset.status.replace('_', ' ')}</span>
          </div>
          <h1 className="text-xl font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{asset.name}</h1>
        </div>
        <Link href={`/assets/${asset.id}/edit`} className="btn-secondary">
          <Edit size={15} />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Asset Details</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {fields.map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-sm font-medium mt-0.5 capitalize" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
            {asset.notes && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Notes</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{asset.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Current assignment */}
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Assignment</p>
            {asset.assigned_user ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--accent-blue)', color: 'white' }}>
                    {asset.assigned_user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{asset.assigned_user.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{asset.assigned_user.department || asset.assigned_user.email}</p>
                  </div>
                </div>
                {asset.assigned_at && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Since {format(new Date(asset.assigned_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not assigned</p>
            )}
          </div>

          <AssignAsset asset={asset} employees={employees || []} />
        </div>
      </div>
    </div>
  )
}
