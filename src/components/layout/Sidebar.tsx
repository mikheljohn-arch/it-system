'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Monitor, Ticket, Key, LayoutDashboard, LogOut, Settings, ChevronRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { clsx } from 'clsx'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/helpdesk', icon: Ticket, label: 'Helpdesk', badge: 'employee' },
  { href: '/assets', icon: Monitor, label: 'Assets', badge: 'it_staff' },
  { href: '/licenses', icon: Key, label: 'Licenses', badge: 'it_staff' },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const isStaff = profile.role === 'it_staff' || profile.role === 'admin'

  return (
    <aside className="w-60 flex flex-col h-screen sticky top-0" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--accent-blue)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>IT Portal</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const restricted = badge === 'it_staff' && !isStaff
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={restricted ? '#' : href}
              className={clsx('sidebar-link', active && 'active', restricted && 'opacity-40 cursor-not-allowed')}
              onClick={e => restricted && e.preventDefault()}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} style={{ color: 'var(--accent-blue)' }} />}
            </Link>
          )
        })}

        {profile.role === 'admin' && (
          <Link href="/admin" className={clsx('sidebar-link', pathname.startsWith('/admin') && 'active')}>
            <Settings size={17} />
            <span className="flex-1">Admin</span>
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2" style={{ background: 'var(--bg-hover)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'var(--accent-blue)', color: 'white' }}>
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</p>
            <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>{profile.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={signOut} className="sidebar-link w-full">
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
