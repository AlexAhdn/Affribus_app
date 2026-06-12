import React, { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { ArrowLeft, Calendar, Check, Clock, Copy, Download, Expand, MapPin, Ticket } from 'lucide-react'
import api from '../../api/api'
import { isAuthenticated } from '../../utils/auth'
import { downloadTicketPdf, formatDate, formatMoney, getTicketStatusMeta, normalizeTicketForView } from '../../utils/ticket'

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-900">{value || '-'}</p>
    </div>
  )
}

function TicketDetail() {
  const { ticketId } = useParams()
  const qrRef = useRef(null)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: `/voyageur/billets/${ticketId}` }} />
  }

  useEffect(() => {
    let mounted = true
    api.get(`/my-tickets/${ticketId}`)
      .then(({ data }) => {
        if (mounted) setTicket(data.ticket)
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || 'Impossible de charger ce billet.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [ticketId])

  const view = ticket ? normalizeTicketForView(ticket) : null
  const routeLabel = view ? `${view.route.departure_city || '-'} -> ${view.route.arrival_city || '-'}` : '-'
  const statusMeta = ticket ? getTicketStatusMeta(ticket) : null

  const copyUniqueNumber = async () => {
    if (!view?.uniqueNumber) return
    await navigator.clipboard.writeText(view.uniqueNumber)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const handleDownload = () => {
    const qrCanvas = qrRef.current?.querySelector('canvas')
    downloadTicketPdf({ ticket, route: view.route, qrCanvas })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/voyageur" className="inline-flex items-center gap-2 text-sm font-black text-slate-700 hover:text-orange-600">
            <ArrowLeft size={18} />
            Espace voyageur
          </Link>
          <Link to="/mes-tickets" className="text-sm font-black text-orange-600">Mes billets</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <p className="rounded-md bg-white p-8 text-center font-bold text-slate-400">Chargement...</p>
        ) : error ? (
          <p className="rounded-md border border-red-100 bg-red-50 p-5 font-bold text-red-700">{error}</p>
        ) : ticket && view ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-6">
              <div className="rounded-md border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">Billet de transport</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight">{ticket.company?.name || 'Compagnie'}</h1>
                    <p className="mt-2 text-lg font-bold text-slate-600">{routeLabel}</p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-2 rounded-md px-4 py-2 text-xs font-black uppercase tracking-widest ${statusMeta.className}`}>
                    <Ticket size={16} />
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <Info label="Date du voyage" value={formatDate(view.travelDate)} />
                  <Info label="Heure depart" value={view.route.departure_time} />
                  <Info label="Station embarquement" value={ticket.boarding_station} />
                  <Info label="Montant" value={formatMoney(view.amount)} />
                  <Info label="Transaction" value={ticket.transaction_id} />
                  <Info label="Numero unique" value={view.uniqueNumber} />
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-black">Passagers et sieges</h2>
                <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
                  <div className="grid grid-cols-[90px_1fr_80px] bg-slate-900 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">
                    <span>Passager</span>
                    <span>Nom</span>
                    <span className="text-right">Siege</span>
                  </div>
                  {view.passengers.map((passenger) => (
                    <div key={passenger.seat} className="grid grid-cols-[90px_1fr_80px] items-center gap-3 border-t border-slate-100 px-4 py-3">
                      <span className="text-xs font-black uppercase text-orange-600">{passenger.label}</span>
                      <span className="min-w-0 font-bold uppercase">{passenger.name}</span>
                      <span className="text-right font-black">{passenger.seat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-md border border-slate-200 bg-white p-6">
              <div ref={qrRef} className="text-center">
                <div className="inline-flex rounded-md border border-slate-900 bg-white p-4">
                  <QRCodeCanvas value={view.uniqueNumber} size={190} />
                </div>
                <p className="mt-4 break-words text-sm font-black uppercase tracking-widest text-slate-900">{view.uniqueNumber}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Numero unique de validation</p>
              </div>

              <div className="mt-6 grid gap-3">
                <button onClick={handleDownload} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-orange-600">
                  <Download size={17} />
                  Telecharger PDF
                </button>
                <button onClick={copyUniqueNumber} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-orange-200 hover:text-orange-600">
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  {copied ? 'Numero copie' : 'Copier le numero unique'}
                </button>
                <button onClick={() => setQrOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-orange-200 hover:text-orange-600">
                  <Expand size={17} />
                  Afficher QR code
                </button>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-500">
                <p className="flex items-center gap-2"><Calendar size={16} className="text-orange-500" /> {formatDate(view.travelDate)}</p>
                <p className="flex items-center gap-2"><Clock size={16} className="text-orange-500" /> {view.route.departure_time || '-'}</p>
                <p className="flex items-center gap-2"><MapPin size={16} className="text-orange-500" /> {ticket.boarding_station || '-'}</p>
              </div>
            </aside>
          </div>
        ) : null}
      </main>

      {qrOpen && view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
          <button className="absolute inset-0" aria-label="Fermer" onClick={() => setQrOpen(false)} />
          <div className="relative w-full max-w-md rounded-md bg-white p-6 text-center shadow-2xl">
            <QRCodeCanvas value={view.uniqueNumber} size={300} />
            <p className="mt-5 break-words text-base font-black uppercase tracking-widest">{view.uniqueNumber}</p>
            <button onClick={() => setQrOpen(false)} className="mt-6 rounded-md bg-slate-900 px-5 py-3 text-sm font-black text-white">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketDetail
