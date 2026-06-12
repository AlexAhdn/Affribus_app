import React, { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Bus, Calendar, Eye, LogOut, MapPin, Ticket } from 'lucide-react'
import api from '../../api/api'
import { isAuthenticated, getSessionUser, logout } from '../../utils/auth'

function formatDate(value) {
  if (!value) return 'Date non definie'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function MyTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: '/mes-tickets' }} />
  }

  const user = getSessionUser()

  useEffect(() => {
    api.get('/my-tickets')
      .then(({ data }) => setTickets(data?.tickets || []))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger vos billets.'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/voyageur" className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <Bus size={20} />
            </div>
            <span className="font-black tracking-tighter uppercase">
              Afri<span className="text-orange-600">Bus</span>
            </span>
          </Link>
          <button type="button" onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600">
            <LogOut size={18} />
            Deconnexion
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Mes billets</h1>
            <p className="text-slate-500">
              Identifiant voyageur: <span className="font-semibold text-slate-700">{user?.phone || user?.email}</span>
            </p>
          </div>
          <Link to="/voyageur" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-orange-600">
            Espace voyageur
          </Link>
        </div>

        {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}

        {loading ? (
          <p className="rounded-2xl bg-white p-8 text-center font-bold text-slate-400">Chargement...</p>
        ) : tickets.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center font-bold text-slate-400">Aucun billet pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
                    <Ticket size={22} />
                  </div>
                  <div>
                    <p className="font-black text-lg">
                      {ticket.route?.departure_city || '-'} {'->'} {ticket.route?.arrival_city || '-'}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(ticket.travel_date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} />
                        Siege(s) {(ticket.seats || []).join(', ') || '-'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-2">{ticket.transaction_id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-green-100 text-green-700">
                    {ticket.status}
                  </span>
                  <Link to={`/voyageur/billets/${ticket.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-orange-600">
                    <Eye size={16} />
                    Voir billet
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default MyTickets
