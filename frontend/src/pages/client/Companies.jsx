import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Bus,
  CalendarDays,
  MapPin,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react'
import api from '../../api/api'

function formatDisplayDate(iso) {
  if (!iso) return 'Date non précisée'
  try {
    const d = new Date(`${iso}T12:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return iso
  }
}

function formatPrice(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function RouteCard({ route, onChoose }) {
  const companyName = route.company?.name ?? 'Compagnie'
  const depStation = route.departure_city ?? '—'
  const arrStation = route.arrival_city ?? '—'

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-orange-500/10 md:p-8"
    >
      <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-600">
              <Bus size={14} strokeWidth={2.5} />
              {companyName}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            <time dateTime={route.departure_time}>{route.departure_time ?? '—'}</time>
            <ArrowRight className="mx-1 inline h-6 w-6 text-orange-500" strokeWidth={2.5} />
            <time dateTime={route.arrival_time}>{route.arrival_time ?? '—'}</time>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="font-medium">{depStation}</span>
            </span>
            <span className="hidden text-slate-300 sm:inline">→</span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="font-medium">{arrStation}</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-4 sm:items-end">
          <p className="text-center text-3xl font-black text-slate-900 sm:text-right">
            {formatPrice(route.price)}
          </p>
          <button
            type="button"
            onClick={() => onChoose(route.id)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-[0.98] md:min-w-[180px]"
          >
            Choisir
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}

function Companies() {
  const { from, to } = useParams()
  const [searchParams] = useSearchParams()
  const date = searchParams.get('date') ?? ''
  const navigate = useNavigate()

  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fromLabel = decodeURIComponent(from ?? '')
  const toLabel = decodeURIComponent(to ?? '')

  useEffect(() => {
    let cancelled = false

    async function fetchRoutes() {
      setLoading(true)
      setError(null)

      try {
        const qFrom = encodeURIComponent(from ?? '')
        const qTo = encodeURIComponent(to ?? '')
        const { data } = await api.get(`/routes/search?from=${qFrom}&to=${qTo}`)
        if (cancelled) return

        const list = Array.isArray(data) ? data : data?.data
        setRoutes(Array.isArray(list) ? list : [])
      } catch (err) {
        if (cancelled) return
        const msg =
          err.response?.data?.message ??
          err.message ??
          'Impossible de charger les trajets.'
        setError(typeof msg === 'string' ? msg : 'Erreur réseau.')
        setRoutes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRoutes()
    return () => {
      cancelled = true
    }
  }, [from, to])

  const handleChoose = (routeId) => {
    navigate(`/booking/${routeId}`, {
      state: { date }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-orange-600"
          >
            <ChevronLeft size={20} />
            Accueil
          </Link>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-500 p-2 text-white">
              <Bus size={20} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-black uppercase tracking-tight">
              Afri<span className="text-orange-600">Bus</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 space-y-4 sm:mb-14">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">
            Trajets disponibles
          </p>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">
            <span className="text-slate-800">{fromLabel}</span>
            <span className="mx-2 inline-block text-orange-500">→</span>
            <span className="text-slate-800">{toLabel}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              <CalendarDays className="h-4 w-4 text-orange-500" />
              {formatDisplayDate(date)}
            </span>
            {date && (
              <span className="text-xs font-mono text-slate-400">({date})</span>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white/80 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="text-sm font-bold text-slate-500">Chargement des trajets…</p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="flex items-start gap-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900"
          >
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-black">Erreur</p>
              <p className="mt-1 text-sm font-medium opacity-90">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && routes.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-inner">
            <Clock className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">
              Aucun trajet disponible pour ce parcours
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Essayez d&apos;autres villes ou une autre date depuis l&apos;accueil.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
            >
              Modifier la recherche
            </Link>
          </div>
        )}

        {!loading && !error && routes.length > 0 && (
          <div className="flex flex-col gap-6">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} onChoose={handleChoose} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Companies
