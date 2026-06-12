import React, { useEffect, useState } from 'react'
import {
  Loader2,
  Trash2,
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Power
} from 'lucide-react'
import api from '../../api/api'
import AdminLayout from '../../components/admin/AdminLayout'

function Companies() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [lastCreated, setLastCreated] = useState(null)
  const normalizeCompany = (company) => ({
    ...company,
    status: company.status || 'pending',
    routes_count: company.routes_count || 0,
    tickets_sold_count: company.tickets_sold_count || 0
  })
  const statusLabels = {
    pending: 'En attente',
    active: 'Validée',
    inactive: 'Inactive',
  }
  const statusClasses = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    inactive: 'bg-red-50 text-red-700 border-red-100',
  }

  const fetchCompanies = async (currentPage = page, query = search) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/companies', { params: { page: currentPage, search: query } })
      setRows((data.data || []).map(normalizeCompany))
      setPage(data.current_page || 1)
      setLastPage(data.last_page || 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies(1, '')
  }, [])

  const createCompany = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/admin/companies', form)
      const createdCompany = normalizeCompany(data)

      // On garde une trace pour afficher les identifiants à l'admin
      setLastCreated({ email: form.email, pass: form.phone })

      // Reset du formulaire
      setForm({ name: '', email: '', phone: '' })
      setSearch('')

      // Rafraîchir la liste
      setRows((prev) => [createdCompany, ...prev.filter((company) => company.id !== createdCompany.id)].slice(0, 10))
      setPage(1)
      setLastPage((prev) => Math.max(prev, 1))

      // Faire disparaître le message de succès après 20 secondes
      setTimeout(() => setLastCreated(null), 20000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création de la compagnie")
    } finally {
      setSaving(false)
    }
  }

  const removeCompany = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette compagnie et tous ses accès ?')) {
      try {
        await api.delete(`/admin/companies/${id}`)
        fetchCompanies(page, search)
      } catch (err) {
        alert("Erreur lors de la suppression")
      }
    }
  }

  const approveCompany = async (company) => {
    setApprovingId(company.id)
    setError('')

    try {
      const { data } = await api.patch(`/admin/companies/${company.id}/approve`)
      const approvedCompany = normalizeCompany(data)
      setRows((prev) => prev.map((item) => item.id === approvedCompany.id ? approvedCompany : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Validation de la compagnie impossible')
    } finally {
      setApprovingId(null)
    }
  }

  const toggleCompanyStatus = async (company) => {
    setTogglingId(company.id)
    setError('')

    try {
      const { data } = await api.patch(`/admin/companies/${company.id}/toggle-status`)
      const updatedCompany = normalizeCompany(data)
      setRows((prev) => prev.map((item) => item.id === updatedCompany.id ? updatedCompany : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Changement de statut impossible')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <AdminLayout title="Gestion des Compagnies">

      {/* Message de Succès (Affiche le mot de passe généré) */}
      {lastCreated && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-4 shadow-sm animate-pulse">
          <div className="p-2 bg-emerald-500 text-white rounded-full">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-emerald-900 font-bold text-sm">Compagnie créée avec succès !</p>
            <p className="text-emerald-700 text-xs">
              Login : <span className="font-bold">{lastCreated.email}</span> | Mot de passe : <span className="font-bold">{lastCreated.pass}</span>
            </p>
          </div>
          <button onClick={() => setLastCreated(null)} className="text-emerald-400 hover:text-emerald-600 font-bold px-2">✕</button>
        </div>
      )}

      {/* Formulaire d'Ajout */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="text-orange-500" size={20} /> Nouvelle Compagnie
        </h2>
        <form onSubmit={createCompany} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
              placeholder="Nom de l'entreprise"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              type="email"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
              placeholder="Email (Sert de login)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
              placeholder="Téléphone (Sert de MP)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors disabled:bg-slate-300 shadow-lg shadow-orange-100"
            disabled={saving}
          >
            <Plus size={20} />
            {saving ? 'Création...' : 'Ajouter'}
          </button>
        </form>
      </div>

      {/* Recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          onClick={() => fetchCompanies(1, search)}
        >
          Rechercher
        </button>
      </div>

      {/* Table des résultats */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-slate-500 italic font-medium">Chargement des compagnies...</p>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center text-red-500 gap-2">
            <AlertCircle size={40} />
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Compagnie</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Trajets</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Tickets</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.length > 0 ? rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusClasses[c.status] || statusClasses.pending}`}>
                        {statusLabels[c.status] || 'En attente'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 flex items-center gap-1"><Mail size={14} /> {c.email}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1"><Phone size={12} /> {c.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{c.routes_count || 0}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{c.tickets_sold_count || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {c.status === 'pending' && (
                          <button
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            onClick={() => approveCompany(c)}
                            disabled={approvingId === c.id}
                          >
                            {approvingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                            Valider
                          </button>
                        )}
                        {c.status !== 'pending' && (
                          <button
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition disabled:opacity-50 ${
                              c.status === 'active'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            onClick={() => toggleCompanyStatus(c)}
                            disabled={togglingId === c.id}
                          >
                            {togglingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                            {c.status === 'active' ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                        <button
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors group"
                          onClick={() => removeCompany(c.id)}
                          aria-label={`Supprimer ${c.name}`}
                        >
                          <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400 italic">Aucune compagnie enregistrée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between px-4 pb-10">
        <p className="text-sm text-slate-500">Page {page} sur {lastPage}</p>
        <div className="flex gap-2">
          <button
            className="px-6 py-2 rounded-xl border border-slate-200 text-sm font-bold disabled:opacity-30 hover:bg-slate-50 transition-all"
            disabled={page <= 1}
            onClick={() => fetchCompanies(page - 1, search)}
          >
            Précédent
          </button>
          <button
            className="px-6 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-sm font-bold disabled:opacity-30 hover:bg-orange-100 transition-all"
            disabled={page >= lastPage}
            onClick={() => fetchCompanies(page + 1, search)}
          >
            Suivant
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Companies
