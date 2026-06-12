import React, { useEffect, useState } from 'react'
import { AlertCircle, BadgePercent, CheckCircle2, Loader2, Save } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../api/api'

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`
}

function Tarification() {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadTiers = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/admin/reservation-fee-tiers')
      setTiers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger la grille de tarification')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTiers()
  }, [])

  const updateTier = (id, field, value) => {
    setTiers((items) => items.map((tier) => (
      tier.id === id ? { ...tier, [field]: value } : tier
    )))
  }

  const saveTier = async (tier) => {
    setSavingId(tier.id)
    setError('')
    setSuccess('')

    try {
      const payload = {
        label: tier.label,
        min_price: Number(tier.min_price || 0),
        max_price: tier.max_price === '' || tier.max_price === null ? null : Number(tier.max_price),
        fee: Number(tier.fee || 0),
        position: Number(tier.position || 0),
        active: Boolean(tier.active),
      }

      const { data } = await api.put(`/admin/reservation-fee-tiers/${tier.id}`, payload)
      setTiers((items) => items.map((item) => (item.id === tier.id ? data : item)))
      setSuccess('Grille de commission mise a jour.')
      setTimeout(() => setSuccess(''), 2500)
    } catch (err) {
      const firstError = Object.values(err.response?.data?.errors || {})?.[0]?.[0]
      setError(firstError || err.response?.data?.message || 'Mise a jour impossible')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <AdminLayout title="Tarification">
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-orange-400">Grille de commission - Benin</p>
              <h2 className="mt-2 text-2xl font-black">Frais de reservation client</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                Ces frais sont ajoutes au prix du ticket lors de la validation client. Vous pouvez modifier chaque tranche a tout moment.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
              <BadgePercent size={24} />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-600">
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="animate-spin text-orange-500" size={34} />
              <p className="text-sm font-bold text-slate-400">Chargement de la grille...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Libelle</th>
                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Prix min</th>
                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Prix max</th>
                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Commission</th>
                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">Actif</th>
                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <input
                          value={tier.label || ''}
                          onChange={(event) => updateTier(tier.id, 'label', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="0"
                          value={tier.min_price ?? 0}
                          onChange={(event) => updateTier(tier.id, 'min_price', event.target.value)}
                          className="w-32 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="0"
                          value={tier.max_price ?? ''}
                          placeholder="Illimite"
                          onChange={(event) => updateTier(tier.id, 'max_price', event.target.value)}
                          className="w-32 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="0"
                          value={tier.fee ?? 0}
                          onChange={(event) => updateTier(tier.id, 'fee', event.target.value)}
                          className="w-32 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-black text-orange-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(tier.active)}
                          onChange={(event) => updateTier(tier.id, 'active', event.target.checked)}
                          className="h-5 w-5 accent-orange-500"
                        />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => saveTier(tier)}
                          disabled={savingId === tier.id}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {savingId === tier.id ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                          Sauver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {tiers.slice(0, 3).map((tier) => (
            <div key={`preview-${tier.id}`} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{tier.label}</p>
              <p className="mt-2 text-2xl font-black text-orange-600">{formatMoney(tier.fee)}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

export default Tarification
