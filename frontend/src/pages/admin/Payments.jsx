import React, { useEffect, useState } from 'react'
import { 
  Loader2, 
  Calendar, 
  Search, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react'
import api from '../../api/api'
import AdminLayout from '../../components/admin/AdminLayout'

function Payments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/payments', {
        params: { date: date || undefined }
      })
      setRows(data.data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des paiements', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Calcul du total des frais de reservation affiches
  const totalCommissions = rows.reduce((sum, p) => sum + Number(p.commission_amount || 0), 0)

  const getStatusBadge = (status) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 w-fit"
    switch (status?.toLowerCase()) {
      case 'success':
      case 'paid':
        return <span className={`${base} bg-green-50 text-green-600 border-green-100`}><CheckCircle2 size={12}/> Succès</span>
      case 'pending':
        return <span className={`${base} bg-amber-50 text-amber-600 border-amber-100`}><Clock size={12}/> En attente</span>
      default:
        return <span className={`${base} bg-red-50 text-red-600 border-red-100`}><XCircle size={12}/> Échec</span>
    }
  }

  return (
    <AdminLayout title="Historique des Paiements">
      {/* Header Statistique Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-100 relative overflow-hidden">
          <TrendingUp className="absolute right-4 bottom-4 opacity-20" size={80} />
          <p className="text-orange-100 text-sm font-bold uppercase tracking-wider">Frais de reservation (Vue actuelle)</p>
          <h3 className="text-3xl font-black mt-2">
            {totalCommissions.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span>
          </h3>
        </div>
        
        {/* Filtre Date intégré à côté */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm">
          <p className="text-slate-500 text-sm font-bold mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-orange-500" /> Filtrer par date de transaction
          </p>
          <div className="flex gap-3">
            <input 
              type="date" 
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:outline-none transition-all text-sm font-medium"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button 
              onClick={load}
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all flex items-center gap-2"
            >
              <Search size={18} /> Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Liste des Transactions */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-slate-500 italic font-medium">Analyse des transactions en cours...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium">
            Aucun paiement enregistré pour cette période.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">ID Transaction</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Montant Brut</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Frais de reservation</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Méthode</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                      {p.transaction_id || '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {Number(p.amount || 0).toLocaleString('fr-FR')} <span className="text-[10px] text-slate-400">FCFA</span>
                    </td>
                    <td className="px-6 py-4 font-black text-orange-600">
                      +{Number(p.commission_amount || 0).toLocaleString('fr-FR')} <span className="text-[10px]">FCFA</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm capitalize">
                        <CreditCard size={14} /> {p.method || 'kkiapay'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Payments
