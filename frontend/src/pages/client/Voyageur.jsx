import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bus,
  CalendarDays,
  Clock,
  History,
  Home,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Mail,
  Search,
  Ticket,
  User,
  RotateCcw,
  X,
} from 'lucide-react'
import api from '../../api/api'
import { getSessionUser, logout } from '../../utils/auth'
import { getTicketStatusMeta, isTicketUsed } from '../../utils/ticket'

const today = new Date().toISOString().slice(0, 10)

function formatDate(value) {
  if (!value) return 'Date non definie'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`
}

function routeLabel(ticket) {
  const route = ticket.route
  return `${route?.departure_city || '-'} -> ${route?.arrival_city || '-'}`
}

function TicketCard({ ticket }) {
  const navigate = useNavigate()
  const statusMeta = getTicketStatusMeta(ticket)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-600">
              <Bus size={14} />
              {ticket.company?.name || 'Compagnie'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900">{routeLabel(ticket)}</h3>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} className="text-orange-500" />
              {formatDate(ticket.travel_date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Ticket size={15} className="text-orange-500" />
              Siege(s) {(ticket.seats || []).join(', ') || '-'}
            </span>
            {ticket.boarding_station && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-orange-500" />
                {ticket.boarding_station}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-slate-400">{ticket.transaction_id || `#${ticket.id}`}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Montant</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatMoney(ticket.amount)}</p>
          <button onClick={() => navigate(`/voyageur/billets/${ticket.id}`)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-orange-600">
            <Ticket size={16} />
            Voir billet
          </button>
        </div>
      </div>
    </article>
  )
}

function Voyageur() {
  const navigate = useNavigate()
  const user = getSessionUser()
  const [cities, setCities] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState({ from: '', to: '', date: today })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState('home')

  useEffect(() => {
    let mounted = true
    Promise.all([api.get('/cities'), api.get('/my-tickets')])
      .then(([citiesResponse, ticketsResponse]) => {
        if (!mounted) return
        const cityList = Array.isArray(citiesResponse.data) ? citiesResponse.data : citiesResponse.data?.data || []
        setCities(cityList.filter((city) => city?.name))
        setTickets(ticketsResponse.data?.tickets || [])
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.response?.data?.message || 'Impossible de charger votre espace voyageur.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  const recentRoutes = useMemo(() => {
    const seen = new Set()
    return tickets
      .filter((ticket) => ticket.route_id && ticket.route && (isTicketUsed(ticket) || String(ticket.travel_date || '') < today))
      .sort((a, b) => String(b.travel_date || '').localeCompare(String(a.travel_date || '')) || Number(b.id) - Number(a.id))
      .filter((ticket) => {
        if (seen.has(ticket.route_id)) return false
        seen.add(ticket.route_id)
        return true
      })
      .slice(0, 4)
  }, [tickets])

  const upcomingTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'paid' && !isTicketUsed(ticket) && String(ticket.travel_date || '') >= today),
    [tickets]
  )

  const historyTickets = useMemo(
    () => tickets.filter((ticket) => isTicketUsed(ticket) || String(ticket.travel_date || '') < today),
    [tickets]
  )

  const handleSearch = (event) => {
    event.preventDefault()
    if (!search.from || !search.to || !search.date || search.from === search.to) return
    navigate(`/companies/${encodeURIComponent(search.from)}/${encodeURIComponent(search.to)}?date=${search.date}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const openView = (view) => {
    setActiveView(view)
    setMobileMenuOpen(false)
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const menuItems = [
    { key: 'tickets', label: 'Mes tickets', icon: Ticket },
    { key: 'history', label: 'Historique de reservation', icon: History },
    { key: 'profile', label: 'Profil', icon: User },
  ]

  const renderMenuItem = (item, className = '') => {
    const Icon = item.icon

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => openView(item.key)}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black transition ${activeView === item.key
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
        } ${className}`}
      >
        <Icon size={18} />
        {item.label}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="relative border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button type="button" onClick={() => openView('home')} className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-500 p-2 text-white">
              <Bus size={20} />
            </div>
            <span className="font-black uppercase tracking-tight">Afri<span className="text-orange-600">Bus</span></span>
          </button>
          <button onClick={handleLogout} className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:text-orange-600 lg:inline-flex">
            <LogOut size={17} />
            Deconnexion
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:text-orange-600 lg:hidden"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-200/70 lg:hidden">
            <div className="mx-auto grid max-w-6xl gap-2">
              {menuItems.map((item) => renderMenuItem(item))}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                Deconnexion
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <button
            type="button"
            onClick={() => openView('home')}
            className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black transition ${activeView === 'home' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'}`}
          >
            <Home size={18} />
            Accueil
          </button>
          {menuItems.map((item) => renderMenuItem(item, 'w-full'))}
          <button onClick={handleLogout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50">
            <LogOut size={18} />
            Deconnexion
          </button>
        </aside>

        <section className="space-y-6">
          {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

          {activeView === 'home' && (
            <>
              <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">Reservation rapide</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">Bonjour {user?.name || 'voyageur'}</h1>
                <form onSubmit={handleSearch} className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_170px_auto]">
                  <select value={search.from} onChange={(e) => setSearch((current) => ({ ...current, from: e.target.value }))} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none focus:border-orange-400 [&>option]:bg-slate-900 [&>option]:text-white" required>
                    <option value="">Depart</option>
                    {cities.map((city) => <option key={city.id} value={city.name}>{city.name}</option>)}
                  </select>
                  <select value={search.to} onChange={(e) => setSearch((current) => ({ ...current, to: e.target.value }))} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none focus:border-orange-400 [&>option]:bg-slate-900 [&>option]:text-white" required>
                    <option value="">Arrivee</option>
                    {cities.map((city) => <option key={city.id} value={city.name} disabled={city.name === search.from}>{city.name}</option>)}
                  </select>
                  <input type="date" value={search.date} onChange={(e) => setSearch((current) => ({ ...current, date: e.target.value }))} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none focus:border-orange-400" required />
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-600">
                    <Search size={18} />
                    Rechercher
                  </button>
                </form>
              </div>

              <section className="space-y-4">
                <h2 className="text-xl font-black">Trajets recents</h2>
                {loading ? (
                  <p className="rounded-2xl bg-white p-6 font-bold text-slate-400">Chargement...</p>
                ) : recentRoutes.length === 0 ? (
                  <p className="rounded-2xl bg-white p-6 font-bold text-slate-400">Aucun trajet reserve pour le moment.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {recentRoutes.map((ticket) => (
                      <article key={ticket.route_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-widest text-orange-600">{ticket.company?.name || 'Compagnie'}</p>
                        <h3 className="mt-2 text-lg font-black">{routeLabel(ticket)}</h3>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <Clock size={15} />
                          {ticket.route?.departure_time || '-'}
                        </p>
                        <button onClick={() => navigate(`/booking/${ticket.route_id}`)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-orange-600">
                          <RotateCcw size={16} />
                          Reserver a nouveau
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeView === 'tickets' && (
            <section className="space-y-4">
              <h1 className="text-2xl font-black">Mes tickets</h1>
              {upcomingTickets.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 font-bold text-slate-400">Aucun billet a venir.</p>
              ) : upcomingTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
            </section>
          )}

          {activeView === 'history' && (
            <section className="space-y-4">
              <h1 className="text-2xl font-black">Historique de reservation</h1>
              {historyTickets.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 font-bold text-slate-400">Aucun trajet passe.</p>
              ) : historyTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
            </section>
          )}

          {activeView === 'profile' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Profil</p>
                  <h1 className="text-2xl font-black text-slate-900">{user?.name || '-'}</h1>
                </div>
              </div>
              <div className="grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4"><Phone size={16} className="text-orange-500" /> {user?.phone || '-'}</p>
                <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4"><Mail size={16} className="text-orange-500" /> {user?.email || '-'}</p>
              </div>
              <button onClick={handleLogout} className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-orange-600">
                <LogOut size={17} />
                Deconnexion
              </button>
            </section>
          )}
        </section>
      </main>
    </div>
  )
}

export default Voyageur
