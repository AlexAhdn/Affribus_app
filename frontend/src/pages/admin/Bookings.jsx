import React, { useEffect, useState } from 'react'
import { Loader2, Filter, Calendar, Building2, Search, TicketCheck, Info, Trash2, MapPin, ChevronDown, ChevronRight, User } from 'lucide-react'
import api from '../../api/api'
import AdminLayout from '../../components/admin/AdminLayout'

function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/bookings', {
        params: { status: status || undefined, date: date || undefined, company: companySearch || undefined }
      })
      const bookingsData = Array.isArray(data) ? data : (data.data || [])
      setBookings(bookingsData)
    } catch (err) {
      console.error('Erreur', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // --- LOGIQUE DE REGROUPEMENT : Compagnie > Trajet ---
  const groupedData = bookings.reduce((acc, booking) => {
    const companyName = booking.route?.company?.name || 'Sans Compagnie'
    const routeKey = `${booking.route?.departure_city} → ${booking.route?.arrival_city} (${booking.route?.departure_time})`

    if (!acc[companyName]) acc[companyName] = {}
    if (!acc[companyName][routeKey]) acc[companyName][routeKey] = []

    acc[companyName][routeKey].push(booking)
    return acc
  }, {})

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getStatusStyle = (s) => {
    switch (s?.toLowerCase()) {
      case 'paid': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100'
      case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100'
      default: return 'text-slate-600 bg-slate-50 border-slate-100'
    }
  }

  return (
    <AdminLayout title="Registre des Réservations">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* BARRE DE FILTRES COMPACTE */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Compagnie</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" value={companySearch} onChange={e => setCompanySearch(e.target.value)} placeholder="Ex: Nana Express" className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-orange-500/20" />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-orange-500/20">
              <option value="">Tous les statuts</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-orange-500/20" />
          </div>

          <button onClick={load} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm shadow-sm">
            <Search size={16} /> Rechercher
          </button>
        </div>

        {/* LISTE GROUPÉE */}
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 text-slate-400">Aucune réservation trouvée.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedData).map(([company, routes]) => (
              <div key={company} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Header Compagnie */}
                <div
                  className="bg-slate-50/50 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleGroup(company)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Building2 size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-800 uppercase tracking-tight">{company}</h2>
                      <p className="text-xs text-slate-500 font-medium">{Object.keys(routes).length} trajet(s) actif(s)</p>
                    </div>
                  </div>
                  {expandedGroups[company] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>

                {/* Contenu de la Compagnie (Trajets) */}
                {expandedGroups[company] && (
                  <div className="p-4 space-y-6">
                    {Object.entries(routes).map(([routeTitle, reservations]) => (
                      <div key={routeTitle} className="border border-slate-100 rounded-xl overflow-hidden">
                        {/* Sous-titre Trajet */}
                        <div className="bg-slate-50/30 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <MapPin size={14} className="text-orange-400" /> {routeTitle}
                          </span>
                          <span className="text-[10px] bg-white px-2 py-1 rounded border font-bold text-slate-400 uppercase">
                            {reservations.length} Passagers
                          </span>
                        </div>

                        {/* Tableau des passagers */}
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-white">
                              <th className="px-4 py-3 font-black">Passager</th>
                              <th className="px-4 py-3 font-black">Montant</th>
                              <th className="px-4 py-3 font-black">Statut</th>
                              <th className="px-4 py-3 font-black text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {reservations.map((booking) => (
                              <tr key={booking.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                      <User size={14} />
                                    </div>
                                    <span className="font-bold text-slate-700">{booking.client}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-600">
                                  {parseInt(booking.amount).toLocaleString()} F
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(booking.status)}`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Bookings