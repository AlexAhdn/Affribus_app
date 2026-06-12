import React, { useEffect, useState } from 'react'
import { AlertCircle, Bus, CheckCircle, Clock3, Loader2, MapPin, Plus, Trash2 } from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

const normalizeList = (data) => (Array.isArray(data) ? data : data?.data || [])

function CompanyRoutes() {
  const [routes, setRoutes] = useState([])
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    departure_city: '',
    arrival_city: '',
    departure_time: '',
    arrival_time: '',
    price: '',
    bus_id: '',
  })
  const hasError = Boolean(error)
  const hasSuccess = Boolean(success)
  const hasRoutes = routes.length > 0

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [routesResponse, busesResponse] = await Promise.all([
        api.get('/company/routes'),
        api.get('/company/buses'),
      ])

      const routeList = normalizeList(routesResponse.data)
      const busList = normalizeList(busesResponse.data)

      setRoutes(routeList)
      setBuses(busList)
      setForm((prev) => ({
        ...prev,
        bus_id: prev.bus_id || busList[0]?.id || '',
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les trajets de la compagnie')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.post('/company/routes', {
        ...form,
        price: Number(form.price),
      })

      setRoutes((current) => [data, ...current.filter((route) => route.id !== data.id)])
      setForm({
        departure_city: '',
        arrival_city: '',
        departure_time: '',
        arrival_time: '',
        price: '',
        bus_id: form.bus_id || buses[0]?.id || '',
      })
      setSuccess('Trajet cree avec succes et visible cote client.')
    } catch (err) {
      setError(err.response?.data?.message || 'Creation du trajet impossible')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (route) => {
    const confirmed = window.confirm(`Supprimer le trajet ${route.departure_city} - ${route.arrival_city} ?`)
    if (!confirmed) return

    setDeletingId(route.id)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/company/routes/${route.id}`)
      setRoutes((prev) => prev.filter((item) => item.id !== route.id))
      setSuccess('Trajet supprime avec succes.')
    } catch (err) {
      setError(err.response?.data?.message || 'Suppression du trajet impossible')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <CompanyLayout title="Mes Trajets">
      <div
        className={`mb-6 rounded-[2rem] border p-5 font-bold transition ${
          hasError
            ? 'border-red-100 bg-red-50 text-red-600'
            : 'border-red-100 bg-red-50 text-red-600 hidden'
        }`}
        role="alert"
        aria-hidden={!hasError}
      >
        <div className="flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>

      <div
        className={`mb-6 rounded-[2rem] border p-5 font-bold transition ${
          hasSuccess
            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
            : 'border-emerald-100 bg-emerald-50 text-emerald-700 hidden'
        }`}
        role="status"
        aria-hidden={!hasSuccess}
      >
        <div className="flex items-center gap-3">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-5 flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <Plus className="text-orange-500" size={20} />
            Nouveau Trajet
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              placeholder="Ville de depart"
              value={form.departure_city}
              onChange={(e) => setForm({ ...form, departure_city: e.target.value })}
              required
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              placeholder="Ville d'arrivee"
              value={form.arrival_city}
              onChange={(e) => setForm({ ...form, arrival_city: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="time"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                value={form.departure_time}
                onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                required
              />
              <input
                type="time"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                value={form.arrival_time}
                onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
              />
            </div>
            <input
              type="number"
              min="0"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              placeholder="Prix"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              value={form.bus_id}
              onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
              required
            >
              {buses.length === 0 ? (
                <option value="">Creez d'abord un bus</option>
              ) : (
                buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name} - {bus.registration_number}
                  </option>
                ))
              )}
            </select>

            <button
              type="submit"
              disabled={saving || buses.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:bg-slate-300"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <Loader2 className={saving ? 'animate-spin' : 'hidden'} size={18} />
                <Plus className={saving ? 'hidden' : ''} size={18} />
              </span>
              <span>{saving ? 'Creation...' : 'Creer le trajet'}</span>
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-5 text-xl font-black text-slate-900 dark:text-white">Trajets de la compagnie</h3>

          <div className={loading ? 'flex items-center justify-center py-20' : 'hidden'} aria-hidden={!loading}>
            <Loader2 className="animate-spin text-orange-500" size={28} />
          </div>

          <p
            className={!loading && !hasRoutes ? 'rounded-2xl bg-slate-50 px-5 py-10 text-center font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'hidden'}
            aria-hidden={loading || hasRoutes}
          >
            Aucun trajet cree pour le moment.
          </p>

          <div className={!loading && hasRoutes ? 'space-y-4' : 'hidden'} aria-hidden={loading || !hasRoutes}>
            {routes.map((route) => (
              <article key={route.id ?? `${route.departure_city}-${route.arrival_city}-${route.departure_time}-${route.bus_id}`} className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                      <MapPin size={18} className="text-orange-500" />
                      <span>{route.departure_city}</span>
                      <span className="text-orange-500">-</span>
                      <span>{route.arrival_city}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Clock3 size={14} /> <span>{route.departure_time}</span></span>
                      <span className="flex items-center gap-1"><Bus size={14} /> <span>{route.bus?.name || 'Bus'}</span></span>
                      <span>{Number(route.price || 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600 dark:bg-slate-600 dark:text-slate-200">
                      {route.bus?.registration_number || 'Sans immatriculation'}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(route)}
                      disabled={deletingId === route.id}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                      aria-label={`Supprimer ${route.departure_city} ${route.arrival_city}`}
                    >
                      <Loader2 className={deletingId === route.id ? 'animate-spin' : 'hidden'} size={17} />
                      <Trash2 className={deletingId === route.id ? 'hidden' : ''} size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </CompanyLayout>
  )
}

export default CompanyRoutes
