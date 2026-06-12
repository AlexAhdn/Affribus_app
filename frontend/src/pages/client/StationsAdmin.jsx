import React, { useEffect, useMemo, useState } from 'react'
import api from '../../api/api'

function StationsAdmin() {
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    city: '',
    address: '',
  })

  useEffect(() => {
    api.get('/companies')
      .then(({ data }) => {
        setCompanies(data || [])
        if (data?.length) setSelectedCompanyId(String(data[0].id))
      })
      .catch(() => setError('Impossible de charger les compagnies.'))
  }, [])

  const selectedCompany = useMemo(
    () => companies.find((c) => String(c.id) === String(selectedCompanyId)),
    [companies, selectedCompanyId]
  )

  const loadStations = async (companyId) => {
    if (!companyId) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/stations/company/${companyId}`)
      setStations(Array.isArray(data) ? data : [])
    } catch {
      setError('Impossible de charger les stations.')
      setStations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStations(selectedCompanyId)
  }, [selectedCompanyId])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCompanyId) return

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.post('/stations', {
        company_id: Number(selectedCompanyId),
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim() || null,
      })

      setMessage('Station ajoutée avec succès.')
      setForm({ name: '', city: '', address: '' })
      await loadStations(selectedCompanyId)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
        <h1 className="text-2xl font-black mb-6">Gestion des stations</h1>

        <div className="mb-6">
          <label className="block text-xs font-black uppercase text-slate-500 mb-2">
            Compagnie
          </label>
          <select
            className="w-full p-3 rounded-xl border border-slate-300 font-bold"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-black uppercase text-slate-400 mb-2">Stations existantes</p>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : stations.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune station pour cette compagnie.</p>
          ) : (
            <ul className="space-y-2">
              {stations.map((station) => (
                <li key={station.id} className="text-sm font-semibold text-slate-700">
                  {station.name} ({station.city})
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Maximum 2 stations par compagnie.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nom de la station"
            className="w-full p-3 rounded-xl border border-slate-300 font-semibold"
            required
          />
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Ville"
            className="w-full p-3 rounded-xl border border-slate-300 font-semibold"
            required
          />
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Adresse (optionnelle)"
            className="w-full p-3 rounded-xl border border-slate-300 font-semibold"
          />
          <button
            type="submit"
            disabled={saving || !selectedCompany}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-black disabled:bg-slate-300"
          >
            {saving ? 'Ajout en cours...' : 'Ajouter la station'}
          </button>
        </form>

        {message && <p className="mt-4 text-green-600 font-bold">{message}</p>}
        {error && <p className="mt-4 text-red-600 font-bold">{error}</p>}
      </div>
    </div>
  )
}

export default StationsAdmin
