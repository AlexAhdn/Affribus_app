import React, { useEffect, useState } from 'react'
import { Loader2, MapPin, Navigation, Bus, Building2, Filter } from 'lucide-react'
import api from '../../api/api'
import AdminLayout from '../../components/admin/AdminLayout'

function Trajets() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ company: '', min_price: '' })

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/routes', { params: filter })
      setRoutes(data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoutes() }, [])

  return (
    <AdminLayout title="Catalogue des Trajets">
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex-1 relative">
          <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-orange-500 outline-none text-sm" 
            placeholder="Filtrer par compagnie..."
            onChange={(e) => setFilter({...filter, company: e.target.value})}
          />
        </div>
        <div className="w-full md:w-48 relative">
          <Filter className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="number"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-orange-500 outline-none text-sm" 
            placeholder="Prix min..."
            onChange={(e) => setFilter({...filter, min_price: e.target.value})}
          />
        </div>
        <button onClick={fetchRoutes} className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all">
          Filtrer
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {routes.map((route) => (
            <div key={route.id} className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-lg transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                  <Bus size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-800 font-black text-lg">
                    <span>{route.departure_city}</span>
                    <Navigation size={16} className="text-orange-500 rotate-90" />
                    <span>{route.arrival_city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm font-medium">
                    <Building2 size={14} /> {route.company?.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tarif</p>
                <p className="text-xl font-black text-slate-900">
                  {Number(route.price).toLocaleString('fr-FR')} <span className="text-orange-500 text-xs">FCFA</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

export default Trajets