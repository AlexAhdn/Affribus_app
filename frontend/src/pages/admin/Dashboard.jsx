import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Loader2,
  Wallet,
  DollarSign,
  Ticket,
  MapPin,
  Building2,
  Users,
  Bell,
  LogOut
} from 'lucide-react'
import api from '../../api/api'
import AdminLayout from '../../components/admin/AdminLayout'

const statsConfig = [
  { key: 'total_revenue', label: 'Revenu total', money: true, icon: Wallet, color: 'from-orange-500 to-orange-600', badge: 'Wallet', path: '/admin/payments' },
  { key: 'gross_sales', label: 'Montant réservations', money: true, icon: DollarSign, color: 'from-amber-500 to-amber-600', badge: 'Statistique', path: '/admin/bookings' },
  { key: 'total_tickets', label: 'Réservations', money: false, icon: Ticket, color: 'from-orange-400 to-orange-500', badge: 'Ticket', path: '/admin/bookings' },
  { key: 'total_routes', label: 'Trajets actifs', money: false, icon: MapPin, color: 'from-orange-500 to-orange-600', badge: 'Statistique', path: '/admin/Trajets' },
  { key: 'total_companies', label: 'Compagnies', money: false, icon: Building2, color: 'from-slate-700 to-slate-800', badge: 'Statistique', path: '/admin/companies' },
  { key: 'total_users', label: 'Utilisateurs', money: false, icon: Users, color: 'from-orange-600 to-orange-700', badge: 'Statistique', path: '#' },
]

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    // Logique de déconnexion (ex: suppression token)
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <AdminLayout title="Tableau de Bord">
      <div className="w-full min-h-screen space-y-8">

        {/* --- HEADER D'ACTIONS RAPIDES --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Vue d'ensemble</h2>
            <p className="text-sm text-slate-500">Bienvenue sur votre espace de gestion AfriBus</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton Notifications */}
            <Link
              to="/admin/notifications"
              className="relative p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors group"
            >
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            </Link>

            {/* Bouton Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 text-white hover:bg-red-600 transition-all duration-300 font-semibold shadow-lg shadow-slate-200"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* --- CONTENU PRINCIPAL --- */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-slate-500 font-medium italic">Chargement des données d'AfriBus...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-medium flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} /> {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
            {statsConfig.map((item) => (
              <Link
                to={item.path}
                key={item.key}
                className="group relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-orange-100 hover:-translate-y-1 block"
              >
                {/* Cercle décoratif en arrière-plan */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${item.color} opacity-5 rounded-full group-hover:scale-110 transition-transform`} />

                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                    <item.icon size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50 px-2 py-1 rounded-lg">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 mb-1">{item.label}</p>
                  <h3 className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                    {Number(data?.[item.key] ?? 0).toLocaleString('fr-FR')}
                    {item.money && <span className="text-xs font-bold text-orange-500">FCFA</span>}
                  </h3>
                </div>

                {/* Barre de progression décorative en bas */}
                <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${item.color} w-2/3 opacity-30 group-hover:opacity-100 transition-opacity`} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Dashboard
