import React, { useEffect, useState } from 'react'
import { AlertCircle, Bus, CheckCircle, Loader2, Plus, Rows3, Trash2 } from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

const normalizeList = (data) => (Array.isArray(data) ? data : data?.data || [])

function CompanyBuses() {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    name: '',
    registration_number: '',
    seat_count: '',
  })
  const hasError = Boolean(error)
  const hasSuccess = Boolean(success)
  const hasBuses = buses.length > 0

  const loadBuses = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/company/buses')
      setBuses(normalizeList(data))
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les bus')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBuses()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.post('/company/buses', {
        ...form,
        seat_count: Number(form.seat_count),
      })

      setBuses((current) => [data, ...current.filter((bus) => bus.id !== data.id)])
      setForm({ name: '', registration_number: '', seat_count: '' })
      setSuccess('Bus cree avec ses sieges.')
    } catch (err) {
      setError(err.response?.data?.message || 'Creation du bus impossible')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (bus) => {
    const confirmed = window.confirm(`Supprimer le bus "${bus.name}" ?`)
    if (!confirmed) return

    setDeletingId(bus.id)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/company/buses/${bus.id}`)
      setBuses((prev) => prev.filter((item) => item.id !== bus.id))
      setSuccess('Bus supprime avec succes.')
    } catch (err) {
      setError(err.response?.data?.message || 'Suppression du bus impossible')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <CompanyLayout title="Mes Bus">
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
            Nouveau Bus
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              placeholder="Nom du bus"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              placeholder="Immatriculation"
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              required
            />
            <input
              type="number"
              min="1"
              max="100"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              placeholder="Nombre de sieges"
              value={form.seat_count}
              onChange={(e) => setForm({ ...form, seat_count: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:bg-slate-300"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <Loader2 className={saving ? 'animate-spin' : 'hidden'} size={18} />
                <Plus className={saving ? 'hidden' : ''} size={18} />
              </span>
              <span>{saving ? 'Creation...' : 'Creer le bus'}</span>
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-5 text-xl font-black text-slate-900 dark:text-white">Bus et sieges</h3>

          <div className={loading ? 'flex items-center justify-center py-20' : 'hidden'} aria-hidden={!loading}>
            <Loader2 className="animate-spin text-orange-500" size={28} />
          </div>

          <p
            className={!loading && !hasBuses ? 'rounded-2xl bg-slate-50 px-5 py-10 text-center font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'hidden'}
            aria-hidden={loading || hasBuses}
          >
            Aucun bus enregistre pour le moment.
          </p>

          <div className={!loading && hasBuses ? 'grid gap-4 md:grid-cols-2' : 'hidden'} aria-hidden={loading || !hasBuses}>
            {buses.map((bus) => (
              <article key={bus.id ?? bus.registration_number} className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                      <Bus size={18} className="text-orange-500" />
                      <span>{bus.name}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{bus.registration_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl bg-white px-4 py-3 text-right dark:bg-slate-600">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">Sieges</p>
                      <p className="mt-1 flex items-center gap-1 text-lg font-black text-slate-900 dark:text-white">
                        <Rows3 size={16} className="text-orange-500" />
                        <span>{bus.seats_count || bus.seat_count || 0}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(bus)}
                      disabled={deletingId === bus.id}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                      aria-label={`Supprimer ${bus.name}`}
                    >
                      <Loader2 className={deletingId === bus.id ? 'animate-spin' : 'hidden'} size={17} />
                      <Trash2 className={deletingId === bus.id ? 'hidden' : ''} size={17} />
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

export default CompanyBuses
