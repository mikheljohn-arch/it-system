'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewLicensePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', vendor: '', category: 'productivity', license_type: 'subscription',
    license_key: '', total_seats: '', cost_per_seat: '', total_cost: '',
    billing_cycle: 'annual', purchase_date: '', renewal_date: '', expiry_date: '',
    vendor_contact: '', vendor_email: '', notes: '', status: 'active',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const payload: any = { ...form, created_by: user!.id }
    // Clean empty numerics
    for (const f of ['total_seats', 'cost_per_seat', 'total_cost']) {
      if (!payload[f]) delete payload[f]
    }
    for (const f of ['purchase_date', 'renewal_date', 'expiry_date']) {
      if (!payload[f]) delete payload[f]
    }
    if (!payload.license_key) delete payload.license_key
    if (!payload.billing_cycle) delete payload.billing_cycle

    const { data, error: err } = await supabase.from('software_licenses').insert(payload).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/licenses/${data.id}`)
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/licenses" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Add Software License</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track a subscription or software license</p>
        </div>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Software Name *</label>
            <input className="input" placeholder="Microsoft 365" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Vendor *</label>
            <input className="input" placeholder="Microsoft" value={form.vendor} onChange={e => set('vendor', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
              {['productivity', 'security', 'development', 'design', 'communication', 'erp', 'crm', 'cloud', 'other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">License Type</label>
            <select className="select" value={form.license_type} onChange={e => set('license_type', e.target.value)}>
              {['perpetual', 'subscription', 'per_user', 'concurrent', 'open_source'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">License Key</label>
          <input className="input font-mono text-xs" placeholder="XXXXX-XXXXX-XXXXX" value={form.license_key} onChange={e => set('license_key', e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Total Seats</label>
            <input type="number" className="input" placeholder="25" value={form.total_seats} onChange={e => set('total_seats', e.target.value)} />
          </div>
          <div>
            <label className="label">Cost/Seat (₱)</label>
            <input type="number" className="input" placeholder="0.00" value={form.cost_per_seat} onChange={e => set('cost_per_seat', e.target.value)} />
          </div>
          <div>
            <label className="label">Total Cost (₱)</label>
            <input type="number" className="input" placeholder="0.00" value={form.total_cost} onChange={e => set('total_cost', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Billing Cycle</label>
            <select className="select" value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="one_time">One-time</option>
            </select>
          </div>
          <div>
            <label className="label">Renewal Date</label>
            <input type="date" className="input" value={form.renewal_date} onChange={e => set('renewal_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Expiry Date</label>
            <input type="date" className="input" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vendor Contact</label>
            <input className="input" placeholder="Account Manager name" value={form.vendor_contact} onChange={e => set('vendor_contact', e.target.value)} />
          </div>
          <div>
            <label className="label">Vendor Email</label>
            <input type="email" className="input" placeholder="support@vendor.com" value={form.vendor_email} onChange={e => set('vendor_email', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} placeholder="Login portal, activation notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/licenses" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save License
          </button>
        </div>
      </form>
    </div>
  )
}
