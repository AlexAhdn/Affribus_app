import React, { useEffect, useState } from 'react'
import {
    Bell,
    Bus,
    LayoutDashboard,
    LogOut,
    MapPinned,
    Settings,
    Ticket,
    QrCode,
    User,
    Wallet,
    Search,
    Sun,
    Moon,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import api from '../../api/api'

const navigation = [
    { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/company/buses', label: 'Mes Bus', icon: Bus },
    { to: '/company/trajets', label: 'Trajets', icon: MapPinned },
    { to: '/company/reservations', label: 'Reservations', icon: Ticket },
    { to: '/company/validation-billet', label: 'Validation billet', icon: QrCode },
    { to: '/company/wallet', label: 'Wallet', icon: Wallet },
    { to: '/company/notifications', label: 'Notifications', icon: Bell },
    { to: '/company/parametre', label: 'Parametre', icon: Settings },
]

function CompanyLayout({ children, title, headerAction, showHeaderSearch = false }) {
    const navigate = useNavigate()
    const [unreadCount, setUnreadCount] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [theme, setTheme] = useState(() => localStorage.getItem('company-theme') || 'light')
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    const [companyLogo, setCompanyLogo] = useState(userData?.company_logo || userData?.logo || userData?.company?.logo || '')
    const isReservationUser = userData?.role === 'company_reservation'
    const companyName = userData?.company_name || userData?.name || 'Compagnie'
    const companyEmail = userData?.email || ''
    const isDark = theme === 'dark'

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDark])

    const toggleTheme = () => {
        setTheme((currentTheme) => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
            localStorage.setItem('company-theme', nextTheme)
            return nextTheme
        })
    }

    useEffect(() => {
        let mounted = true

        api.get('/company/profile')
            .then(({ data }) => {
                if (mounted) setCompanyLogo(data?.logo || '')
            })
            .catch(() => {})

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        let mounted = true

        if (isReservationUser) return undefined

        api.get('/company/notifications', { params: { per_page: 1 } })
            .then(({ data }) => {
                if (mounted) setUnreadCount(Number(data.unread_count || 0))
            })
            .catch(() => {
                if (mounted) setUnreadCount(0)
            })

        return () => {
            mounted = false
        }
    }, [isReservationUser])

    useEffect(() => {
        const handleUnreadCount = (event) => {
            setUnreadCount(Number(event.detail?.count || 0))
        }

        window.addEventListener('company-notifications:unread-count', handleUnreadCount)

        return () => {
            window.removeEventListener('company-notifications:unread-count', handleUnreadCount)
        }
    }, [])

    const handleLogout = () => {
        localStorage.clear()
        navigate('/admin/login')
    }

    return (
        <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col bg-slate-900 p-7 text-white lg:flex rounded-tr-[3.5rem]">
                <div className="mb-8 flex flex-col items-center border-b border-slate-800/70 pb-7 text-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white text-orange-600 shadow-xl shadow-slate-950/30 ring-1 ring-white/10">
                        {companyLogo ? (
                            <img src={companyLogo} alt={companyName} className="h-full w-full object-contain p-2" />
                        ) : (
                            <Bus size={34} strokeWidth={2.5} />
                        )}
                    </div>
                    <p className="mt-4 max-w-full truncate text-sm font-black text-white">{companyName}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">Espace compagnie</p>
                </div>

                <nav className="flex-1 space-y-1 px-2">
                    {(isReservationUser ? navigation.filter((item) => ['/company/reservations', '/company/validation-billet'].includes(item.to)) : navigation).map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 rounded-2xl px-4 py-3 text-xs font-bold tracking-wide transition ${isActive
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-950/20'
                                        : 'text-slate-200 hover:text-white'
                                    }`
                                }
                            >
                                <Icon size={18} strokeWidth={2.5} className="opacity-90" />
                                {item.label}
                            </NavLink>
                        )
                    })}
                </nav>

                <div className="mt-auto px-2 pt-6 border-t border-slate-800/60">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-100"
                    >
                        <LogOut size={15} />
                        Deconnexion
                    </button>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-72">
                <main className={`min-h-screen min-w-0 transition-colors ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                    <header className={`sticky top-0 z-30 flex flex-col gap-4 border-b px-5 py-5 transition-colors md:flex-row md:items-center md:justify-between lg:px-8 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'}`}>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Portail partenaire</p>
                            <h2 className={`mt-1 text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                            {showHeaderSearch && (
                                <label className="relative w-full sm:w-80 xl:hidden">
                                    <Search size={17} className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                    <input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Rechercher..."
                                        className={`h-11 w-full rounded-2xl border py-2 pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:font-medium focus:border-orange-300 focus:ring-4 focus:ring-orange-100 ${
                                            isDark
                                                ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:ring-orange-500/10'
                                                : 'border-slate-100 bg-slate-50 text-slate-700 placeholder:text-slate-400'
                                        }`}
                                    />
                                </label>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                                        isDark
                                            ? 'border-slate-800 bg-slate-900 text-amber-300 hover:border-amber-400/40'
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-orange-100 hover:bg-orange-50 hover:text-orange-600'
                                    }`}
                                    aria-label={isDark ? 'Passer au theme clair' : 'Passer au theme sombre'}
                                    title={isDark ? 'Theme clair' : 'Theme sombre'}
                                >
                                    {isDark ? <Sun size={19} /> : <Moon size={19} />}
                                </button>

                                {!isReservationUser && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/company/notifications')}
                                        className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                                            isDark
                                                ? 'border-slate-800 bg-slate-900 text-slate-400 hover:border-orange-400/30 hover:text-orange-300'
                                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-orange-100 hover:bg-orange-50 hover:text-orange-600'
                                        }`}
                                        aria-label="Notifications"
                                    >
                                        <Bell size={19} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                <div className={`flex min-w-0 items-center gap-3 rounded-2xl border p-2 pr-4 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                        <User size={19} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`truncate text-sm font-black leading-none ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{companyName}</p>
                                        <p className={`mt-1 truncate text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{companyEmail}</p>
                                    </div>
                                </div>
                            </div>
                            {headerAction && <div className="flex items-center">{headerAction}</div>}
                        </div>
                    </header>

                    <div className="p-5 lg:p-8">{children}</div>
                </main>
            </div>
        </div>
    )
}

export default CompanyLayout
