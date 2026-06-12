import React, { useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { CheckCircle2, Home, Printer, User, Ticket, Calendar, Clock } from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'

function formatTravelDate(value) {
  if (!value) return '—'

  const dateOnly = String(value).slice(0, 10)
  const date = new Date(`${dateOnly}T12:00:00`)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function CompanyTicketSuccess() {
  const { state } = useLocation()
  const ticketRef = useRef(null)

  if (!state || !state.ticket) {
    return (
      <CompanyLayout title="Billet">
        <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
          <Link to="/company/bookings" className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white">
            Retour aux réservations
          </Link>
        </div>
      </CompanyLayout>
    )
  }

  const { ticket } = state
  const route = ticket.route || {}
  const displayName = ticket.customer_name || 'Passager'
  const ticketSeats = Array.isArray(ticket.seats) ? ticket.seats : [ticket.seats]
  const travelDate = ticket.travel_date || state.travelDate
  const transactionId = ticket.transaction_id

  const handlePrint = () => {
    window.print()
  }

  return (
    <CompanyLayout title="Billet Généré">
      <div className="min-h-screen bg-slate-100 py-12 px-4 font-sans print:bg-white print:p-0">
        <div className="mx-auto max-w-xl">
          {/* Message de succès */}
          <div className="mb-10 text-center print:hidden">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Réservation Validée !</h1>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500">Billet prêt à imprimer</p>
          </div>

          {/* STRUCTURE DU BILLET */}
          <div ref={ticketRef} className="overflow-hidden rounded-[2.5rem] border-2 border-slate-200 bg-white" style={{ boxShadow: 'none' }}>
            {/* Entête Orange */}
            <div className="relative bg-orange-500 p-8 text-center text-white" style={{ backgroundColor: '#f97316' }}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Billet de Transport Officiel</p>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">{route.company?.name || 'AFRIBUS'}</h2>
              <div className="absolute -bottom-4 -left-4 h-8 w-8 rounded-full border border-slate-200 bg-slate-100"></div>
              <div className="absolute -bottom-4 -right-4 h-8 w-8 rounded-full border border-slate-200 bg-slate-100"></div>
            </div>

            <div className="space-y-8 p-8 pt-10">
              {/* Trajet (Départ -> Arrivée) */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Départ</p>
                  <p className="text-xl font-black text-slate-900">{route.departure_city || '—'}</p>
                </div>
                <div className="mx-4 flex-1 border-t-2 border-dashed border-slate-100"></div>
                <div className="text-right">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Arrivée</p>
                  <p className="text-xl font-black text-slate-900">{route.arrival_city || '—'}</p>
                </div>
              </div>

              {/* Infos Passager & Sièges */}
              <div className="grid grid-cols-2 gap-y-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <User size={18} color="#94a3b8" />
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Passager</p>
                    <p className="text-sm font-bold leading-tight uppercase text-slate-900">{displayName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <Ticket size={18} color="#94a3b8" />
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Sièges</p>
                    <p className="text-sm font-bold leading-tight uppercase text-orange-600">{ticketSeats.join(', ')}</p>
                  </div>
                </div>

                {/* DATE */}
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <Calendar size={18} color="#94a3b8" />
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Date du voyage</p>
                    <p className="text-sm font-bold leading-tight text-slate-900">
                      {formatTravelDate(travelDate)}
                    </p>
                  </div>
                </div>

                {/* HEURE */}
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <Clock size={18} color="#94a3b8" />
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Départ prévu</p>
                    <p className="text-sm font-bold leading-tight text-slate-900">{route.departure_time || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Séparateur pointillé */}
              <div className="relative border-t-2 border-dashed border-slate-200 py-4">
                <div className="absolute -left-12 -top-4 h-8 w-8 rounded-full border border-slate-200 bg-slate-100"></div>
                <div className="absolute -right-12 -top-4 h-8 w-8 rounded-full border border-slate-200 bg-slate-100"></div>
              </div>

              {/* Section QR Code */}
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-2xl border-2 border-slate-900 bg-white p-3">
                  <QRCodeCanvas value={`AFRIBUS-${transactionId}`} size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Réf: {transactionId}</p>
              </div>
            </div>
          </div>

          {/* Boutons d'actions */}
          <div className="mt-10 grid grid-cols-2 gap-4 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-4 font-black uppercase text-xs tracking-widest text-slate-900 transition-all active:scale-95 hover:bg-slate-50"
            >
              <Printer size={18} /> Imprimer
            </button>
            <Link
              to="/company/bookings"
              className="flex items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 font-black uppercase text-xs tracking-widest text-white shadow-lg shadow-slate-300 transition-all active:scale-95"
            >
              <Home size={18} /> Réservations
            </Link>
          </div>
        </div>
      </div>
    </CompanyLayout>
  )
}

export default CompanyTicketSuccess
