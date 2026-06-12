import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Armchair,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Ticket,
  User,
  Users,
  X,
  Calendar,
} from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

const today = new Date().toISOString().slice(0, 10)

const parseAmount = (value) => {
  if (value == null || value === '') return 0
  const amount = Number(String(value).replace(/\s/g, '').replace(',', '.'))
  return Number.isNaN(amount) ? 0 : amount
}

const formatMoney = (value) => `${parseAmount(value).toLocaleString('fr-FR')} FCFA`

const countSeats = (seats, fallback = 0) => {
  if (Array.isArray(seats)) return seats.length

  if (typeof seats === 'string') {
    try {
      const parsedSeats = JSON.parse(seats)
      if (Array.isArray(parsedSeats)) return parsedSeats.length
    } catch {
      return seats.split(',').map((seat) => seat.trim()).filter(Boolean).length
    }
  }

  const fallbackCount = Number(fallback || 0)
  return Number.isFinite(fallbackCount) ? fallbackCount : 0
}

const normalizeSeats = (seats) => {
  if (Array.isArray(seats)) return seats

  if (typeof seats === 'string') {
    try {
      const parsedSeats = JSON.parse(seats)
      if (Array.isArray(parsedSeats)) return parsedSeats
    } catch {
      return seats.split(',').map((seat) => seat.trim()).filter(Boolean)
    }
  }

  return []
}

const CircularProgress = ({ current, total }) => {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-600" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-out' }}
          strokeLinecap="round"
          fill="transparent"
          className={`${percentage >= 100 ? 'text-red-500' : percentage >= 70 ? 'text-orange-500' : 'text-green-500'}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[14px] font-black text-slate-800 dark:text-white">{current}/{total}</span>
        <span className="text-[7px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-400">Places</span>
      </div>
    </div>
  )
}

function CompanyBookings() {
  const [bookings, setBookings] = useState([])
  const [routesList, setRoutesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalError, setModalError] = useState('')
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [seatPlanLoading, setSeatPlanLoading] = useState(false)
  const [seatPlanReservedSeats, setSeatPlanReservedSeats] = useState([])
  const [travelDate, setTravelDate] = useState(today)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [boardingStations, setBoardingStations] = useState([])
  const [selectedBoardingStationId, setSelectedBoardingStationId] = useState('')
  const [stationsLoading, setStationsLoading] = useState(false)
  const [reservationLoading, setReservationLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('today')
  const [showHistory, setShowHistory] = useState(false)
  const [historyBookings, setHistoryBookings] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const navigate = useNavigate()
  const sessionUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bookingsResponse, routesResponse] = await Promise.all([
        api.get('/company/bookings', {
          params: {
            per_page: 1000,
            period: dateFilter
          }
        }),
        api.get('/company/routes'),
      ])
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : (bookingsResponse.data.data || []))
      setRoutesList(Array.isArray(routesResponse.data) ? routesResponse.data : (routesResponse.data.data || []))
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les réservations')
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    Promise.resolve().then(loadData)
  }, [loadData])

  const loadHistory = useCallback(async () => {
    if (historyLoading || historyBookings.length > 0) return
    setHistoryLoading(true)
    setHistoryError('')

    try {
      const historyResponse = await api.get('/company/bookings', {
        params: {
          per_page: 1000,
          period: 'all'
        }
      })

      setHistoryBookings(Array.isArray(historyResponse.data) ? historyResponse.data : (historyResponse.data.data || []))
    } catch (err) {
      setHistoryError(err.response?.data?.message || 'Impossible de charger l’historique des réservations')
    } finally {
      setHistoryLoading(false)
    }
  }, [historyBookings.length, historyLoading])

  useEffect(() => {
    if (showHistory && historyBookings.length === 0) {
      loadHistory()
    }
  }, [showHistory, historyBookings.length, loadHistory])

  const routes = useMemo(() => {
    return routesList
      .map((route) => ({
        route,
        reservations: bookings.filter((booking) => Number(booking.route?.id || booking.route_id) === Number(route.id)),
      }))
  }, [bookings, routesList])

  const historyRoutes = useMemo(() => {
    return routesList
      .map((route) => ({
        route,
        reservations: historyBookings
          .filter((booking) => Number(booking.route?.id || booking.route_id) === Number(route.id))
          .sort((a, b) => String(a.travel_date || '').localeCompare(String(b.travel_date || '')) || Number(a.id) - Number(b.id)),
      }))
      .filter((item) => item.reservations.length > 0)
  }, [historyBookings, routesList])

  const historySummary = useMemo(() => {
    const totalReservations = historyBookings.length
    const totalSeats = historyBookings.reduce((sum, booking) => sum + countSeats(booking.seats, booking.seat_count), 0)
    const totalRevenue = historyBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0)

    return {
      totalReservations,
      totalSeats,
      totalRevenue,
    }
  }, [historyBookings])

  const selectedRoutePrice = parseAmount(selectedRoute?.price)
  const manualTotal = selectedSeats.length * selectedRoutePrice
  const totalSeats = Number(selectedRoute?.bus?.seat_count || selectedRoute?.available_seats || 40)

  const reservedSeatsForSelectedRoute = useMemo(() => {
    if (!selectedRoute) return []

    const localReservedSeats = bookings
      .filter((booking) => {
        const routeId = booking.route?.id || booking.route_id
        const bookingDate = booking.travel_date?.slice?.(0, 10)
        return Number(routeId) === Number(selectedRoute.id)
          && bookingDate === travelDate
          && booking.status !== 'cancelled'
      })
      .flatMap((booking) => normalizeSeats(booking.seats))
      .map(Number)

    return [...new Set([...seatPlanReservedSeats, ...localReservedSeats])]
  }, [bookings, seatPlanReservedSeats, selectedRoute, travelDate])

  useEffect(() => {
    if (!selectedRoute || !travelDate) {
      setSeatPlanReservedSeats([])
      return
    }

    let cancelled = false
    setSeatPlanLoading(true)

    api.get(`/routes/${selectedRoute.id}/seats`, { params: { date: travelDate } })
      .then(({ data }) => {
        if (cancelled) return
        const reservedSeats = (data.seats || [])
          .filter((seat) => !seat.available)
          .map((seat) => Number(seat.number))
        setSeatPlanReservedSeats(reservedSeats)
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Impossible de charger le plan de sieges:', err.response?.data || err)
          setSeatPlanReservedSeats([])
        }
      })
      .finally(() => {
        if (!cancelled) setSeatPlanLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRoute, travelDate])

  const seats = selectedRoute
    ? Array.from({ length: totalSeats }, (_, index) => ({
      number: index + 1,
      reserved: reservedSeatsForSelectedRoute.includes(index + 1),
    }))
    : []

  useEffect(() => {
    setSelectedSeats((current) => current.filter((seat) => !reservedSeatsForSelectedRoute.includes(seat)))
  }, [reservedSeatsForSelectedRoute])

  const openReservation = (route) => {
    setSelectedRoute({ ...route, price: parseAmount(route.price) })
    setSelectedSeats([])
    setSeatPlanReservedSeats([])
    setBoardingStations([])
    setSelectedBoardingStationId(sessionUser?.role === 'company_reservation' ? String(sessionUser?.station_id || '') : '')
    setTravelDate(today)
    setCustomerName('')
    setCustomerPhone('')
    setModalError('')
    setSuccess('')
  }

  useEffect(() => {
    if (!selectedRoute) return

    const companyId = selectedRoute.company?.id || selectedRoute.company_id || sessionUser?.company_id
    if (!companyId) return

    if (sessionUser?.role === 'company_reservation') {
      setBoardingStations(sessionUser?.station ? [sessionUser.station] : [])
      setSelectedBoardingStationId(String(sessionUser?.station_id || ''))
      return
    }

    let cancelled = false
    setStationsLoading(true)

    api.get(`/stations/company/${companyId}`, {
      params: selectedRoute.departure_city ? { city: selectedRoute.departure_city } : {},
    })
      .then(({ data }) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setBoardingStations(list)
        setSelectedBoardingStationId(list.length === 1 ? String(list[0].id) : '')
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Impossible de charger les stations:', err.response?.data || err)
          setBoardingStations([])
          setSelectedBoardingStationId('')
        }
      })
      .finally(() => {
        if (!cancelled) setStationsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRoute, sessionUser])

  const closeReservation = () => {
    if (reservationLoading) return
    setSelectedRoute(null)
    setSelectedSeats([])
    setModalError('')
  }

  const toggleSeat = (seatNumber) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((seat) => seat !== seatNumber)
        : [...prev, seatNumber].sort((a, b) => a - b)
    )
  }

  const createManualReservation = async () => {
    setModalError('')

    if (!customerName.trim()) {
      setModalError('Veuillez entrer le nom du client.')
      return
    }
    if (selectedSeats.length === 0) {
      setModalError('Veuillez sélectionner au moins un siège.')
      return
    }

    if (boardingStations.length > 0 && !selectedBoardingStationId) {
      setModalError("Veuillez choisir la station d'embarquement.")
      return
    }

    setReservationLoading(true)
    try {
      const { data } = await api.post('/company/manual-reservation', {
        route_id: selectedRoute.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        travel_date: travelDate,
        seats: selectedSeats,
        boarding_station_id: selectedBoardingStationId ? Number(selectedBoardingStationId) : null,
      })

      // Attendre 1 seconde avant redirection
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Rediriger vers la page de succès avec les données du ticket
      navigate('/company/ticket-success', {
        state: {
          ticket: data.ticket,
          travelDate,
        },
      })
    } catch (err) {
      console.error('Erreur réservation:', err.response?.data || err)
      setModalError(err.response?.data?.message || 'Impossible de créer cette réservation.')
      setReservationLoading(false)
    }
  }

  const renderSeat = (seat) => {
    const isSelected = selectedSeats.includes(seat.number)

    return (
      <button
        key={seat.number}
        type="button"
        disabled={seat.reserved}
        onClick={() => toggleSeat(seat.number)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-t-lg border-b-4 transition-all duration-200 ${
          seat.reserved
            ? 'cursor-not-allowed border-red-700 bg-red-500 text-red-100 opacity-80'
            : isSelected
              ? 'z-10 scale-105 border-orange-700 bg-orange-500 text-white shadow-lg'
              : 'border-slate-300 bg-white text-slate-600 hover:border-orange-400 hover:text-orange-500'
        }`}
      >
        <Armchair size={16} />
        <span className="absolute -bottom-4 text-[8px] font-bold text-slate-500">{seat.number}</span>
      </button>
    )
  }

  const renderBusLayout = () => {
    const rows = []
    for (let index = 0; index < seats.length; index += 4) {
      const rowSeats = seats.slice(index, index + 4)
      rows.push(
        <div key={index} className="mb-4 flex justify-center gap-4">
          <div className="flex gap-2">{rowSeats.slice(0, 2).map(renderSeat)}</div>
          <div className="w-6" />
          <div className="flex gap-2">{rowSeats.slice(2, 4).map(renderSeat)}</div>
        </div>
      )
    }

    return (
      <div className="relative mx-auto max-w-xs rounded-[1.75rem] border-4 border-slate-200 bg-gradient-to-b from-slate-100 to-white p-5 shadow-inner">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-t-2xl border-x-2 border-t-2 border-slate-200 bg-slate-200 px-4 py-1 text-[8px] font-black uppercase tracking-widest text-slate-500">
          AVANT
        </div>
        <div className="pt-2">{rows}</div>
        <div className="mt-3 border-t border-slate-200 pt-2 text-center">
          <div className="mx-auto h-0.5 w-8 rounded-full bg-slate-200" />
        </div>
      </div>
    )
  }

  return (
    <CompanyLayout title="Dashboard Réservations">
      <div className="pb-24">
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 font-bold text-emerald-700">
            <CheckCircle2 size={20} /> {success}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDateFilter('today')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                dateFilter === 'today'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-slate-700 border border-slate-100 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <Calendar size={18} />
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateFilter('thisWeek')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                dateFilter === 'thisWeek'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-slate-700 border border-slate-100 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <Calendar size={18} />
              Cette semaine
            </button>
            <button
              onClick={() => setDateFilter('thisMonth')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                dateFilter === 'thisMonth'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-slate-700 border border-slate-100 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <Calendar size={18} />
              Ce mois
            </button>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <Ticket size={18} />
              {showHistory ? 'Masquer l’historique' : 'Historique'}
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Historique complet</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Toutes les réservations passées et futures</h2>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-400">Réservations</p>
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{historySummary.totalReservations}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-400">Sièges</p>
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{historySummary.totalSeats}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-400">Chiffre</p>
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{historySummary.totalRevenue.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </div>

            {historyLoading ? (
              <div className="mt-8 flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-orange-500" size={28} />
              </div>
            ) : historyError ? (
              <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-600">
                {historyError}
              </div>
            ) : historyRoutes.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400">
                Aucune réservation historique à afficher pour le moment.
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {historyRoutes.map((item) => (
                  <div key={item.route.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Trajet</p>
                        <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{item.route.departure_city} → {item.route.arrival_city}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Départ à {item.route.departure_time || '--:--'}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-600">
                          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-300">Réservations</p>
                          <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">{item.reservations.length}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-600">
                          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-300">Sièges</p>
                          <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">{item.reservations.reduce((sum, booking) => sum + countSeats(booking.seats, booking.seat_count), 0)}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-600">
                          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-300">Montant</p>
                          <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">{item.reservations.reduce((sum, booking) => sum + Number(booking.amount || 0), 0).toLocaleString('fr-FR')} FCFA</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white dark:border-slate-600 dark:bg-slate-800">
                      <div className="grid grid-cols-5 gap-4 bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        <span className="col-span-1">Date</span>
                        <span className="col-span-1">Réf.</span>
                        <span className="col-span-1">Client</span>
                        <span className="col-span-1 text-center">Sièges</span>
                        <span className="col-span-1 text-right">Montant</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {item.reservations.map((booking) => (
                          <div key={booking.id} className="grid grid-cols-5 gap-4 px-4 py-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700">
                            <span>{booking.travel_date?.slice(0, 10) || '—'}</span>
                            <span className="font-black">{booking.transaction_id || `#${booking.id}`}</span>
                            <span>{booking.customer_name || booking.client || '—'}</span>
                            <span className="text-center font-black">{countSeats(booking.seats, booking.seat_count)}</span>
                            <span className="text-right font-black text-slate-900 dark:text-white">{Number(booking.amount || 0).toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={28} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-3xl border border-red-100 bg-red-50 p-5 font-bold text-red-600">
            <AlertCircle size={20} /> {error}
          </div>
        ) : showHistory ? null : routes.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Aucun trajet disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {routes.map((item) => {
              const routeTotalSeats = Number(item.route?.bus?.seat_count || item.route?.available_seats || 40)
              const reservedSeats = item.reservations.reduce((sum, reservation) => sum + countSeats(reservation.seats, reservation.seat_count), 0)
              const revenue = item.reservations.reduce((sum, reservation) => sum + Number(reservation.amount || 0), 0)

              return (
                <div key={item.route.id} className="flex h-fit flex-col rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                        <MapPin size={12} />
                        <span>{item.route?.departure_city} → {item.route?.arrival_city}</span>
                      </div>
                      <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                        <Clock size={18} className="text-slate-400" />
                        {item.route?.departure_time || '--:--'}
                      </h3>
                    </div>
                    <CircularProgress current={reservedSeats} total={routeTotalSeats} />
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-700">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-400 dark:text-slate-400">Disponibles</span>
                      <span className="text-lg font-black text-green-600">{Math.max(routeTotalSeats - reservedSeats, 0)}</span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-700">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-400 dark:text-slate-400">Revenue Est.</span>
                      <span className="text-lg font-black text-slate-700 dark:text-slate-200">{revenue.toLocaleString('fr-FR')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openReservation(item.route)}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-bold text-white transition-all hover:bg-orange-600"
                  >
                    <Armchair size={18} />
                    Réserver manuellement
                  </button>

                  <button
                    onClick={() => navigate(`/company/reservations/${item.route?.id}?period=${dateFilter}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 font-bold text-white transition-all hover:bg-slate-800"
                  >
                    <Users size={18} />
                    Voir les {reservedSeats} passagers
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-white/40">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-5 border-b border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-100">
                  <Ticket size={13} />
                  Guichet compagnie
                </div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Réservation Manuelle</h2>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-200">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
                    <MapPin size={16} className="text-orange-300" />
                    {selectedRoute.departure_city} → {selectedRoute.arrival_city}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
                    <Clock size={16} className="text-emerald-300" />
                    {selectedRoute.departure_time || '--:--'}
                  </span>
                </p>
              </div>
              <button onClick={closeReservation} className="rounded-full bg-white/10 p-2 transition-all hover:bg-white/20" aria-label="Fermer">
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-150px)] space-y-6 overflow-y-auto bg-slate-50 p-5 sm:p-8 dark:bg-slate-900">
              {modalError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
                  {modalError}
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Voyage</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Détails du départ</h3>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
                    <CalendarDays size={22} />
                  </div>
                </div>

                <label className="mb-2 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Date du voyage *</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    min={today}
                    value={travelDate}
                    onChange={(e) => {
                      setTravelDate(e.target.value)
                      setSelectedSeats([])
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-bold text-slate-800 outline-none transition-all focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {boardingStations.length > 0 && (
                  <div className="mt-5">
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Station d'embarquement *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select
                        value={selectedBoardingStationId}
                        onChange={(event) => setSelectedBoardingStationId(event.target.value)}
                        disabled={stationsLoading || sessionUser?.role === 'company_reservation'}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-bold text-slate-800 outline-none transition-all focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:disabled:bg-slate-600"
                      >
                        <option value="">{stationsLoading ? 'Chargement...' : 'Choisir une station'}</option>
                        {boardingStations.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.name} ({station.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoTile label="Prix unitaire" value={formatMoney(selectedRoutePrice)} />
                  <InfoTile label="Capacité" value={`${totalSeats} places`} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Sièges</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Plan du bus</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                      <span className="h-2 w-2 rounded-full bg-white ring-1 ring-slate-300" /> Libre
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-orange-700 ring-1 ring-orange-100">
                      <span className="h-2 w-2 rounded-full bg-orange-500" /> Choisi
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-red-700 ring-1 ring-red-100">
                      <span className="h-2 w-2 rounded-full bg-red-500" /> Pris
                    </span>
                  </div>
                </div>
                {seatPlanLoading ? (
                  <div className="flex items-center justify-center rounded-[1.75rem] border-4 border-slate-200 bg-slate-50 py-16">
                    <Loader2 className="animate-spin text-orange-500" size={28} />
                  </div>
                ) : renderBusLayout()}
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-1 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Client</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Informations passager</h3>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <User size={22} />
                  </div>
                </div>
                <Field icon={User} label="Nom complet *" value={customerName} onChange={setCustomerName} placeholder="Entrez le nom du client" />
                <Field icon={Phone} label="Téléphone" value={customerPhone} onChange={setCustomerPhone} placeholder="Numéro de téléphone" />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Sièges sélectionnés</p>
                    <p className="mt-2 min-h-8 text-2xl font-black text-slate-900 dark:text-white">{selectedSeats.length > 0 ? selectedSeats.join(', ') : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Montant estimé</p>
                    <p className="mt-2 text-2xl font-black text-orange-600">{formatMoney(manualTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 pb-1 pt-4 backdrop-blur sm:-mx-8 sm:flex-row sm:justify-end sm:px-8 dark:border-slate-700 dark:bg-slate-900/95">
                <button onClick={closeReservation} className="rounded-2xl bg-slate-100 px-8 py-3.5 font-black text-slate-700 transition-all hover:bg-slate-200">
                  Annuler
                </button>
                <button
                  onClick={createManualReservation}
                  disabled={reservationLoading || selectedSeats.length === 0 || !customerName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-3.5 font-black text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {reservationLoading ? (
                    <>
                      <CheckCircle2 size={18} className="animate-bounce" />
                      Validé
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Valider la réservation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  )
}

function Field({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label}</label>
      <div className="relative">
        {React.createElement(Icon, { className: 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400', size: 18 })}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-bold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-700"
        />
      </div>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="text-right text-sm font-black text-slate-900">{value || '—'}</p>
    </div>
  )
}

export default CompanyBookings
