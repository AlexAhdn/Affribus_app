import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BadgePercent, Bell, LayoutDashboard, Building2, Tickets, Users, Wallet } from 'lucide-react'
import api from '../../api/api'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/companies', label: 'Compagnies', icon: Building2 },
  { to: '/admin/bookings', label: 'Réservations', icon: Tickets },
  { to: '/admin/payments', label: 'Paiements', icon: Wallet },
  { to: '/admin/tarification', label: 'Tarification', icon: BadgePercent },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
]

function AdminLayout({ title, children }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let mounted = true

    api.get('/admin/notifications', { params: { per_page: 1 } })
      .then(({ data }) => {
        if (mounted) setUnreadCount(Number(data.unread_count || 0))
      })
      .catch(() => {
        if (mounted) setUnreadCount(0)
      })

    const handleUnreadCount = (event) => {
      setUnreadCount(Number(event.detail?.count || 0))
    }

    window.addEventListener('admin-notifications:unread-count', handleUnreadCount)

    return () => {
      mounted = false
      window.removeEventListener('admin-notifications:unread-count', handleUnreadCount)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-slate-900 text-white rounded-3xl p-5 h-fit lg:sticky lg:top-6">
          <p className="font-black text-xl mb-6">Super Admin</p>
          <nav className="space-y-2">
            {links.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-sm transition ${
                      isActive ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/admin/notifications' && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h1 className="text-2xl font-black mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
