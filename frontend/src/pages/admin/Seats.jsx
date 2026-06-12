import React, { useEffect, useState } from 'react'
import { Loader2, Armchair, Search, MapPin, Calendar, Building2, Info, User } from 'lucide-react'
import api from '../../api/api'
import AdminLayout from '../../components/admin/AdminLayout'

function Seats() {
  // Initialisation de la date d'aujourd'hui au format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ 
    date: today, 
    company: '', 
    route: '' 
  })

  const loadOccupiedSeats = async () => {
    setLoading(true)
    try {
      // On récupère uniquement les sièges occupés selon les filtres
      const { data } = await api.get('/admin/seats-occupancy', { 
        params: {
            date: filters.date,
            company: filters.company || undefined,
            route: filters.route || undefined,
            status: 'occupied' // On précise au backend qu'on ne veut que les occupés
        } 
      })
      setRows(data.data || [])
    } catch (err) {
      console.error("Erreur lors de la récupération des sièges", err)
    } finally {
      setLoading(false)
    }
  }

  // Chargement automatique au montage du composant avec la date du jour
  useEffect(() => {
    loadOccupiedSeats()
  }, [])

  return (
    <AdminLayout title="Sièges Occupés">
      {/* Barre de Filtres */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Filtre Date (Défaut: Aujourd'hui) */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-orange-500" size={18} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-orange-500 outline-none text-sm font-bold"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
            />
          </div>

          {/* Filtre Compagnie */}
          <div className="relative">
            <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Nom compagnie..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-orange-500 outline-none text-sm"
              value={filters.company}
              onChange={(e) => setFilters({...filters, company: e.target.value})}
            />
          </div>

          {/* Filtre Trajet */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Ex: Cotonou - Parakou" 
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-orange-500 outline-none text-sm"
              value={filters.route}
              onChange={(e) => setFilters({...filters, route: e.target.value})}
            />
          </div>

          {/* Bouton de recherche */}
          <button 
            onClick={loadOccupiedSeats}
            className="bg-slate-900 hover:bg-orange-600 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <Search size={18} /> Filtrer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-slate-500 italic">Analyse du plan de bus...</p>
        </div>
      ) : rows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rows.map((seat, index) => (
            <div key={index} className="group bg-white border border-slate-100 p-5 rounded-3xl flex items-center gap-4 hover:shadow-xl hover:shadow-orange-50 transition-all border-l-4 border-l-orange-500">
              <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Armchair size={28} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-900 text-lg">Siège {seat.seat_number}</h4>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-500 uppercase">Occupé</span>
                </div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-600 flex items-center gap-1.5 font-medium">
                    <User size={14} className="text-slate-400" /> {seat.client_name || 'Client inconnu'}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Building2 size={12} /> {seat.company_name}
                  </p>
                  <p className="text-[11px] text-orange-500 flex items-center gap-1.5 font-bold">
                    <MapPin size={12} /> {seat.route_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] py-24 flex flex-col items-center text-slate-400 shadow-sm">
          <div className="p-6 bg-slate-50 rounded-full mb-4">
            <Info size={48} className="text-slate-300" />
          </div>
          <p className="text-lg font-bold text-slate-500">Aucun siège occupé trouvé</p>
          <p className="text-sm text-slate-400">Essayez de modifier vos filtres ou la date.</p>
        </div>
      )}
    </AdminLayout>
  )
}

export default Seats