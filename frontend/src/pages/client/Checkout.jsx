import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams, Link, useSearchParams } from 'react-router-dom'
import {
  Bus, ArrowRight, Mail, User, ChevronLeft, Ticket,
  Calendar, Clock, CreditCard, AlertTriangle, MapPin, ShieldCheck, Phone
} from 'lucide-react'
import { openKkiapayWidget, addKkiapayListener, removeKkiapayListener, addKkiapayCloseListener } from 'kkiapay'
import api from '../../api/api'
import { getSessionContext, getSessionUser, isAuthenticated } from '../../utils/auth'

const KKIAPAY_PUBLIC_KEY = "18608f4030f811f1b80671888a3f0e35"

function formatPrice(value) {
  return `${Number(value).toLocaleString('fr-FR')} FCFA`
}

function formatDate(dateStr) {
  if (!dateStr) return 'Date non définie';
  try {
    const date = new Date(`${dateStr}T12:00:00`);
    if (isNaN(date.getTime())) return 'Date non définie';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Date non définie';
  }
}

function Checkout() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { routeId } = useParams()
  const [searchParams] = useSearchParams()

  const seats = state?.seats || []
  const route = state?.route || {}
  const travelDate = state?.date || searchParams.get('date')
  const canUseSessionUser = isAuthenticated() && getSessionContext() === 'client'
  const sessionUser = canUseSessionUser ? getSessionUser() : null
  const [boardingStations, setBoardingStations] = useState([])
  const [stationsLoading, setStationsLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [feesLoading, setFeesLoading] = useState(false)
  const [reservationFee, setReservationFee] = useState(0)
  const [passengerNames, setPassengerNames] = useState({})

  const [form, setForm] = useState({
    email: sessionUser?.email || '',
    phone: sessionUser?.phone || '',
    boarding_station_id: '',
    boarding_station: ''
  })

  // On utilise une Ref pour que Kkiapay accède aux données sans re-render le listener
  const formRef = useRef(form);
  const passengerNamesRef = useRef(passengerNames);
  const paymentHandledRef = useRef(false)
  useEffect(() => {
    formRef.current = form;
  }, [form]);
  useEffect(() => {
    passengerNamesRef.current = passengerNames;
  }, [passengerNames]);

  useEffect(() => {
    setPassengerNames((prev) => {
      const next = {}
      seats.forEach((seat, index) => {
        next[seat] = prev[seat] || (index === 0 ? sessionUser?.name || '' : '')
      })
      return next
    })
  }, [seats.join('|'), sessionUser?.name])

  useEffect(() => {
    const companyId = route?.company?.id
    if (!companyId) return

    setStationsLoading(true)
    api.get(`/stations/company/${companyId}`, {
      params: route?.departure_city ? { city: route.departure_city } : {},
    })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : []
        setBoardingStations(list)
        if (list.length === 1) {
          setForm((prev) => ({
            ...prev,
            boarding_station_id: prev.boarding_station_id || String(list[0].id),
            boarding_station: prev.boarding_station || list[0].name
          }))
        }
      })
      .catch((err) => {
        console.error(err)
        setBoardingStations([])
      })
      .finally(() => setStationsLoading(false))
  }, [route?.company?.id, route?.departure_city])

  const ticketTotal = seats.length * (route.price || 0)
  const total = ticketTotal + reservationFee
  const buildPassengerList = (names = passengerNames) => (
    seats.map((seat) => ({
      seat,
      name: names[seat]?.trim() || '',
    }))
  )
  const buildCustomerName = (names = passengerNames) => {
    const passengerList = buildPassengerList(names)
      .map((passenger) => passenger.name)
      .filter(Boolean)

    return passengerList.length > 0 ? passengerList.join(', ') : 'Passager'
  }

  useEffect(() => {
    if (!route?.price || seats.length === 0) return

    setFeesLoading(true)
    api.get('/reservation-fees/calculate', {
      params: { price: route.price, quantity: seats.length },
    })
      .then(({ data }) => setReservationFee(Number(data.total_fee || 0)))
      .catch((err) => {
        console.error(err)
        setReservationFee(0)
      })
      .finally(() => setFeesLoading(false))
  }, [route?.price, seats.length])

  // --- LOGIQUE ENREGISTREMENT BACKEND ---
  const processBooking = async (paymentResponse) => {
    if (paymentHandledRef.current) return
    paymentHandledRef.current = true
    setPaymentLoading(true)
    setPaymentError('')

    try {
      // On prépare les données exactes attendues par ton Laravel
      const bookingPayload = {
        route_id: routeId,
        seats: seats, // Tableau [S1, S2...]
        passenger_names: buildPassengerList(passengerNamesRef.current),
        travel_date: travelDate, // Format YYYY-MM-DD
        customer_name: buildCustomerName(passengerNamesRef.current),
        customer_phone: formRef.current.phone,
        email: formRef.current.email,
        status: 'paid',
        transaction_id: paymentResponse.transactionId || paymentResponse.flwRef || `KKIAPAY-${Date.now()}`, // On récupère l'ID de Kkiapay
        boarding_station: formRef.current.boarding_station,
        boarding_station_id: formRef.current.boarding_station_id ? Number(formRef.current.boarding_station_id) : null,
      }

      const response = await api.post('/tickets', bookingPayload)

      if (response.status === 201 || response.status === 200) {
        // Redirection vers Succès avec l'objet ticket renvoyé par Laravel
        navigate('/success', {
          state: {
            ticket: response.data.ticket || response.data,
            route,
            seats,
            travelDate,
            customerName: buildCustomerName(passengerNamesRef.current),
            passengerNames: buildPassengerList(passengerNamesRef.current)
          }
        })
      }
    } catch (error) {
      paymentHandledRef.current = false
      console.error("Erreur détaillée backend:", error.response?.data || error.message);
      setPaymentError(error.response?.data?.message || "Paiement validé, mais impossible de créer le billet. Contactez le support.")
    } finally {
      setPaymentLoading(false)
    }
  }

  // --- GESTION KKIAPAY ---
  useEffect(() => {
    const successHandler = (response) => {
      processBooking(response);
    };
    const failedHandler = () => {
      paymentHandledRef.current = false
      setPaymentLoading(false)
      setPaymentError('Le paiement a échoué ou a été interrompu. Veuillez réessayer.')
    };
    const closeHandler = () => {
      if (!paymentHandledRef.current) {
        setPaymentLoading(false)
      }
    };
    addKkiapayListener('success', successHandler);
    addKkiapayListener('failed', failedHandler);
    addKkiapayCloseListener(closeHandler);
    return () => {
      removeKkiapayListener('success');
      removeKkiapayListener('failed');
    };
  }, []); // On ne met pas [form] ici pour éviter les bugs de re-init

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePassengerNameChange = (seat, value) => {
    setPassengerNames((prev) => ({
      ...prev,
      [seat]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setPaymentError('')

    if (!form.email || !form.phone) {
      return alert('Veuillez renseigner votre email et le numero de telephone.')
    }
    if (boardingStations.length > 0 && !form.boarding_station_id) {
      setPaymentError("Veuillez choisir votre station d'embarquement.")
      return
    }
    const missingPassengerName = seats.find((seat) => !passengerNames[seat]?.trim())
    if (missingPassengerName) {
      setPaymentError(`Veuillez renseigner le nom du passager du siege ${missingPassengerName}.`)
      return
    }
    if (!travelDate || seats.length === 0 || !route?.id) {
      setPaymentError('Votre session de réservation est incomplète. Veuillez recommencer la sélection.')
      return
    }
    if (!Number.isFinite(total) || total <= 0) {
      setPaymentError('Le montant du paiement est invalide.')
      return
    }
    if (feesLoading) {
      setPaymentError('Calcul des frais de reservation en cours. Veuillez patienter.')
      return
    }

    paymentHandledRef.current = false
    setPaymentLoading(true)

    try {
      openKkiapayWidget({
        amount: Math.round(total),
        key: KKIAPAY_PUBLIC_KEY,
        sandbox: true,
        phoneNumber: form.phone,
        fullname: buildCustomerName(),
        email: form.email,
        reason: `Bus ${route.departure_city} - ${route.arrival_city}`,
        theme: "#ea580c",
        position: "center",
        countries: ["BJ"],
        paymentMethods: ["momo", "card"],
        data: {
          route_id: routeId,
          seats,
          travel_date: travelDate,
          boarding_station: form.boarding_station || null,
          boarding_station_id: form.boarding_station_id || null,
          passenger_names: buildPassengerList(),
        },
      })
    } catch (error) {
      console.error('Erreur ouverture Kkiapay:', error)
      setPaymentLoading(false)
      setPaymentError("Impossible d'ouvrir la fenêtre de paiement. Vérifiez votre connexion puis réessayez.")
    }
  }

  if (!seats.length || !route.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-slate-100 uppercase font-black text-xs tracking-widest">
        <AlertTriangle size={40} className="text-orange-500 mb-4" />
        Session expirée
        <Link to="/" className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-xl">Recommencer</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-slate-900 font-black mb-8 group">
          <div className="p-2 bg-slate-900 text-white rounded-xl group-hover:bg-orange-500 transition-colors">
            <ChevronLeft size={20} />
          </div>
          RETOUR
        </button>

        <div className="grid gap-8">
          {/* RÉSUMÉ DU BILLET */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-2xl">
                  <Bus size={24} />
                </div>
                <div>
                  <h2 className="font-black text-xl uppercase italic leading-none">{route.company?.name || 'AFRIBUS'}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400 mt-1 text-xs">Vérifiez vos infos</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between gap-6 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Départ</p>
                  <h3 className="text-2xl font-black text-slate-900">{route.departure_city}</h3>
                </div>
                <ArrowRight size={24} className="text-orange-500" />
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Arrivée</p>
                  <h3 className="text-2xl font-black text-slate-900">{route.arrival_city}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Date</p>
                  <p className="font-black text-slate-900 text-xs">{formatDate(travelDate)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Heure</p>
                  <p className="font-black text-slate-900 text-xs">{route.departure_time}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sièges</p>
                  <p className="font-black text-slate-900 text-xs">{seats.join(', ')}</p>
                </div>
                <div className="p-4 bg-orange-500 text-white rounded-2xl">
                  <p className="text-[9px] font-black uppercase mb-1 opacity-80">Total</p>
                  <p className="font-black text-xs">{formatPrice(total)}</p>
                </div>
              </div>

              <div className="mb-6 grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                  <span>Prix des tickets</span>
                  <span>{formatPrice(ticketTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                  <span>Frais de reservation</span>
                  <span>{feesLoading ? 'Calcul...' : formatPrice(reservationFee)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-base font-black text-slate-900">
                  <span>Total a payer</span>
                  <span className="text-orange-600">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">
                  Station d'embarquement
                </label>
                <select
                  name="boarding_station_id"
                  value={form.boarding_station_id}
                  onChange={(event) => {
                    const station = boardingStations.find((item) => String(item.id) === event.target.value)
                    setForm({
                      ...form,
                      boarding_station_id: event.target.value,
                      boarding_station: station?.name || '',
                    })
                  }}
                  disabled={stationsLoading || boardingStations.length === 0}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400 disabled:bg-slate-100"
                >
                  {boardingStations.length === 0 ? (
                    <option value="">
                      {stationsLoading ? 'Chargement des stations...' : 'Aucune station disponible'}
                    </option>
                  ) : (
                    <>
                      <option value="">Choisir une station</option>
                      {boardingStations.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.name} ({station.city})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* FORMULAIRE */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-200">
            <h3 className="font-black text-2xl text-slate-900 uppercase italic mb-8">Paiement</h3>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {paymentError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  {paymentError}
                </div>
              )}

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Passagers</p>
                    <h4 className="mt-1 font-black text-slate-900">Nom par siege</h4>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                    {seats.length} siege(s)
                  </span>
                </div>
                <div className="grid gap-3">
                  {seats.map((seat) => (
                    <label key={seat} className="grid gap-2 sm:grid-cols-[90px_1fr] sm:items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Siege {seat}
                      </span>
                      <input
                        type="text"
                        value={passengerNames[seat] || ''}
                        onChange={(event) => handlePassengerNameChange(seat, event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-900 outline-none focus:border-orange-400"
                        placeholder="Nom complet du passager"
                        required
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full p-4 bg-slate-900 text-white rounded-2xl outline-none font-bold" placeholder="E-MAIL" required />
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full p-4 bg-slate-900 text-white rounded-2xl outline-none font-bold" placeholder="TELEPHONE (MOMO)" required />
              </div>

              <button
                type="submit"
                disabled={paymentLoading || feesLoading}
                className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {paymentLoading ? 'Ouverture du paiement...' : feesLoading ? 'Calcul des frais...' : `Payer ${formatPrice(total)}`}
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout;
