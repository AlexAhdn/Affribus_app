import React, { useEffect, useState } from 'react'
import {
  Loader2,
  Search,
  UserX,
  UserCheck,
  Mail,
  Shield,
  User as UserIcon,
  RefreshCcw
} from 'lucide-react'
import api from '../../api/api'
import AdminLayout from '../../components/admin/AdminLayout'

function Users() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', { params: { search } })
      setRows(data.data || [])
    } catch (err) {
      console.error("Erreur chargement utilisateurs", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleBlock = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-block`)
      // Mise à jour locale pour éviter de recharger toute la liste
      setRows(rows.map(u => u.id === id ? { ...u, is_blocked: !u.is_blocked } : u))
    } catch (err) {
      alert("Erreur lors de la modification de l'état")
    }
  }

  return (
    <AdminLayout title="Gestion des Utilisateurs">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* --- BARRE DE RECHERCHE & ACTIONS --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-sm"
              placeholder="Rechercher un nom, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>

          <button
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-200"
            onClick={load}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Mettre à jour
          </button>
        </div>

        {/* --- TABLEAU DES UTILISATEURS --- */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-orange-500" size={40} />
              <p className="text-slate-400 font-medium italic">Récupération de la base usagers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="px-8 py-5 text-left">Utilisateur</th>
                    <th className="px-8 py-5 text-left">Contact</th>
                    <th className="px-8 py-5 text-left">Rôle</th>
                    <th className="px-8 py-5 text-left">Statut</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.length > 0 ? rows.map((u) => (
                    <tr key={u.id} className="group hover:bg-orange-50/30 transition-colors">
                      {/* Colonne Nom */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                            <UserIcon size={20} />
                          </div>
                          <span className="font-bold text-slate-700">{u.name}</span>
                        </div>
                      </td>

                      {/* Colonne Email */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Mail size={14} />
                          {u.email}
                        </div>
                      </td>

                      {/* Colonne Rôle */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-orange-400" />
                          <span className="text-sm font-semibold text-slate-600 italic capitalize">
                            {u.role || 'Client'}
                          </span>
                        </div>
                      </td>

                      {/* Colonne Statut */}
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.is_blocked
                            ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-600'
                          }`}>
                          {u.is_blocked ? 'Bloqué' : 'Actif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => toggleBlock(u.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${u.is_blocked
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                              : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                            }`}
                        >
                          {u.is_blocked ? (
                            <><UserCheck size={14} /> Débloquer</>
                          ) : (
                            <><UserX size={14} /> Bloquer</>
                          )}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-slate-400 italic">
                        Aucun utilisateur trouvé pour cette recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default Users