'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewAssetPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    asset_tag: '', name: '', category: 'laptop', brand: '', model: '',
    serial_number: '', status: 'available', condition: 'good',
    purchase_date: '', purchase_cost: '', warranty_expiry: '', location: '', notes: '',
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
    if (!payload.purchase_cost) delete payload.purchase_cost
    if (!payload.purchase_date) delete payload.purchase_date
    if (!payload.warranty_expiry) delete payload.warranty_expiry
    if (!payload.serial_number) delete payload.serial_number

    const { data, error: err } = await supabase.from('assets').insert(payload).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/assets/${data.id}`)
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assets" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Add New Asset</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Register a device or equipment</p>
        </div>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Asset Tag *</label>
            <input className="input" placeholder="e.g. LT-001" value={form.asset_tag} onChange={e => set('asset_tag', e.target.value)} required />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
              {['laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'printer', 'phone', 'tablet', 'server', 'network', 'peripheral', 'other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Asset Name *</label>
          <input className="input" placeholder="e.g. MacBook Pro 14" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Brand</label>
            <input className="input" placeholder="Apple, Dell, HP..." value={form.brand} onChange={e => set('brand', e.target.value)} />
          </div>
          <div>
            <label className="label">Model</label>
            <input className="input" placeholder="MacBook Pro M3" value={form.model} onChange={e => set('model', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Serial Number</label>
            <input className="input font-mono" placeholder="SN-XXXXXXXXXX" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="Office, Warehouse..." value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Purchase Date</label>
            <input type="date" className="input" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Purchase Cost (₱)</label>
            <input type="number" className="input" placeholder="0.00" value={form.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} />
          </div>
          <div>
            <label className="label">Warranty Expiry</label>
            <input type="date" className="input" value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              {['available', 'assigned', 'under_repair', 'retired', 'lost'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="select" value={form.condition} onChange={e => set('condition', e.target.value)}>
              {['excellent', 'good', 'fair', 'poor'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={3} placeholder="Any additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/assets" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Asset
          </button>
        </div>
      </form>
    </div>
  )
}
