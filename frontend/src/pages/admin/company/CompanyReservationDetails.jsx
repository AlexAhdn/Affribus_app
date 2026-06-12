import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { jsPDF } from 'jspdf'
// Remplacez votre ligne d'import lucide-react par celle-là :
import {
    AlertCircle,
    ArrowLeft,
    Loader2,
    Armchair,
    Download,
    Users,
    Info,
    ChevronRight,
    CheckCircle2,
    CalendarDays,
    MapPin // <--- Il manquait celle-ci
} from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

function formatTravelDate(value) {
    if (!value) return 'Date non définie'

    const dateOnly = String(value).slice(0, 10)
    const date = new Date(`${dateOnly}T12:00:00`)

    if (Number.isNaN(date.getTime())) return 'Date non définie'

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function getTravelDateKey(value) {
    if (!value) return null

    const dateKey = String(value).slice(0, 10)
    const date = new Date(`${dateKey}T12:00:00`)

    return Number.isNaN(date.getTime()) ? null : dateKey
}

function getPeriodLabel(period) {
    switch (period) {
        case 'today':
            return "Aujourd'hui"
        case 'thisWeek':
            return 'Cette semaine'
        case 'thisMonth':
            return 'Ce mois'
        default:
            return 'Periode selectionnee'
    }
}

function normalizeSeats(seats) {
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

function countTicketSeats(ticket) {
    const normalizedSeats = normalizeSeats(ticket?.seats)

    if (normalizedSeats.length > 0) return normalizedSeats.length

    const apiSeatCount = Number(ticket?.seat_count || 0)
    return Number.isFinite(apiSeatCount) ? apiSeatCount : 0
}

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`
}

function sanitizeFileName(value) {
    return String(value || 'liste_voyageurs')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase()
}

function CompanyReservationDetails() {
    const { routeId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [tickets, setTickets] = useState([])
    const [routeDetails, setRouteDetails] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const period = searchParams.get('period') || 'today'

    useEffect(() => {
        Promise.resolve().then(() => {
            if (!routeId) {
                setError('Trajet introuvable.')
                setLoading(false)
                return
            }

            Promise.all([
                api.get('/company/bookings', {
                    params: { route_id: routeId, per_page: 100, period: period }
                }),
                api.get('/company/routes'),
            ])
                .then(([{ data }, routesResponse]) => {
                    const list = Array.isArray(data) ? data : (data.data || [])
                    const routes = Array.isArray(routesResponse.data) ? routesResponse.data : (routesResponse.data.data || [])
                    setRouteDetails(routes.find((route) => Number(route.id) === Number(routeId)) || null)
                    setTickets(
                        list
                            .filter((ticket) => getTravelDateKey(ticket.travel_date))
                            .map((ticket) => ({
                                ...ticket,
                                amount: ticket.amount ?? (countTicketSeats(ticket) * Number(ticket.route?.price || 0))
                            }))
                    )
                })
                .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les passagers'))
                .finally(() => setLoading(false))
        })
    }, [routeId, period])

    const route = tickets[0]?.route || routeDetails
    const travelDates = [...new Set(tickets.map((ticket) => getTravelDateKey(ticket.travel_date)).filter(Boolean))]
    const travelDateLabel = travelDates.length === 1 ? formatTravelDate(travelDates[0]) : travelDates.length > 1 ? 'Plusieurs dates' : getPeriodLabel(period)
    const groupedTickets = Object.entries(
        tickets.reduce((groups, ticket) => {
            const dateKey = getTravelDateKey(ticket.travel_date)
            if (!dateKey) return groups

            groups[dateKey] = groups[dateKey] || []
            groups[dateKey].push(ticket)
            return groups
        }, {})
    )
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, items]) => ({
            date,
            label: formatTravelDate(date),
            tickets: items,
            seatsCount: items.reduce((sum, ticket) => sum + countTicketSeats(ticket), 0),
            amount: items.reduce((sum, ticket) => sum + Number(ticket.amount || 0), 0),
        }))
    const passengerCount = tickets.reduce((sum, ticket) => sum + countTicketSeats(ticket), 0)
    const reservedSeats = new Set()
    tickets.forEach(ticket => {
        normalizeSeats(ticket.seats).forEach(seat => reservedSeats.add(Number(seat)))
    })

    const allSeats = route ? Array.from({ length: route.available_seats }, (_, i) => ({
        number: i + 1,
        reserved: reservedSeats.has(i + 1)
    })) : []

    const downloadPassengers = () => {
        if (tickets.length === 0) return

        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 14
        const rowHeight = 9
        const passengerRows = tickets.flatMap((ticket) => {
            const seats = normalizeSeats(ticket.seats)
            const ticketRows = seats.length > 0 ? seats : ['-']

            return ticketRows.map((seat) => ({
                travelDate: ticket.travel_date,
                reference: ticket.transaction_id || `#${ticket.id}`,
                name: ticket.customer_name || ticket.client || '-',
                seat,
                amount: ticket.amount,
            }))
        })
        const columns = [
            { label: 'Date', x: margin, width: 35 },
            { label: 'Reference', x: 50, width: 34 },
            { label: 'Voyageur', x: 84, width: 52 },
            { label: 'Sieges', x: 136, width: 24 },
            { label: 'Montant', x: 160, width: 36 },
        ]

        const addHeader = () => {
            doc.setFillColor(244, 80, 10)
            doc.rect(0, 0, pageWidth, 18, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(15)
            doc.text('AFRIBUS - Liste des voyageurs', margin, 12)

            doc.setTextColor(15, 23, 42)
            doc.setFontSize(18)
            doc.text(`${route?.departure_city || '-'} - ${route?.arrival_city || '-'}`, margin, 31)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(71, 85, 105)
            doc.text(`Periode : ${travelDateLabel}`, margin, 39)
            doc.text(`Heure : ${route?.departure_time || '-'}`, margin, 45)
            doc.text(`Passagers : ${passengerCount}`, 112, 39)
            doc.text(`Reservations : ${tickets.length}`, 112, 45)

            doc.setDrawColor(226, 232, 240)
            doc.line(margin, 52, pageWidth - margin, 52)
        }

        const addTableHeader = (y) => {
            doc.setFillColor(248, 250, 252)
            doc.rect(margin, y - 6, pageWidth - (margin * 2), 9, 'F')
            doc.setTextColor(71, 85, 105)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            columns.forEach((column) => {
                doc.text(column.label.toUpperCase(), column.x, y)
            })
        }

        const addFooter = () => {
            const pageCount = doc.internal.getNumberOfPages()
            for (let index = 1; index <= pageCount; index += 1) {
                doc.setPage(index)
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(8)
                doc.setTextColor(148, 163, 184)
                doc.text(`Page ${index}/${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
            }
        }

        addHeader()
        addTableHeader(62)

        let y = 72
        passengerRows.forEach((passenger, index) => {
            if (y > pageHeight - 18) {
                doc.addPage()
                addHeader()
                addTableHeader(62)
                y = 72
            }

            const row = [
                formatTravelDate(passenger.travelDate),
                passenger.reference,
                passenger.name,
                passenger.seat,
                formatCurrency(passenger.amount),
            ]

            if (index % 2 === 0) {
                doc.setFillColor(252, 252, 253)
                doc.rect(margin, y - 6, pageWidth - (margin * 2), rowHeight, 'F')
            }

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(15, 23, 42)
            columns.forEach((column, columnIndex) => {
                const text = doc.splitTextToSize(String(row[columnIndex]), column.width)
                doc.text(text.slice(0, 1), column.x, y)
            })

            y += rowHeight
        })

        addFooter()

        const fileRoute = sanitizeFileName(`${route?.departure_city || 'trajet'}_${route?.arrival_city || routeId}`)
        const fileDate = travelDates.length === 1 ? travelDates[0] : period
        doc.save(`voyageurs_${fileRoute}_${fileDate}.pdf`)
    }

    const renderSeat = (seat) => {
        const isReserved = seat.reserved
        return (
            <div
                key={seat.number}
                className={`relative flex items-center justify-center w-12 h-12 rounded-t-xl border-b-4 transition-all duration-200
                    ${isReserved
                        ? 'bg-red-500 border-red-700 text-red-100 shadow-lg shadow-red-100'
                        : 'bg-white border-slate-300 text-slate-600 hover:border-orange-400 hover:text-orange-500'}`}
            >
                <Armchair size={18} />
                <span className="absolute -bottom-5 text-[10px] font-bold text-slate-500">
                    {seat.number}
                </span>
            </div>
        )
    }

    const renderBusLayout = () => {
        if (allSeats.length === 0) return <p className="text-slate-400 italic">Aucun plan disponible</p>

        const rows = []
        for (let i = 0; i < allSeats.length; i += 4) {
            const rowSeats = allSeats.slice(i, i + 4)
            rows.push(
                <div key={i} className="flex justify-center gap-4 mb-4">
                    {rowSeats.map(renderSeat)}
                </div>
            )
        }

        return (
            <div className="relative bg-slate-100/50 border-4 border-slate-200 rounded-[3rem] p-8 max-w-xs mx-auto">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-200 px-6 py-2 rounded-t-3xl border-x-4 border-t-4 border-slate-200 text-[10px] font-bold text-slate-500 tracking-widest">
                    AVANT DU BUS
                </div>

                <div className="pt-4">
                    {rows}
                </div>

                <div className="mt-4 pt-4 border-t-2 border-slate-200 text-center">
                    <div className="w-12 h-1 bg-slate-200 mx-auto rounded-full" />
                </div>
            </div>
        )
    }

    return (
        <CompanyLayout title="Détails du Trajet">
            <div className="pb-24">
                {/* Header Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-3 rounded-2xl bg-white border border-slate-100 px-5 py-3 text-sm font-bold text-slate-600 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Retour au Dashboard
                    </button>

                    {!loading && tickets.length > 0 && (
                        <button
                            onClick={downloadPassengers}
                            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-orange-600 hover:shadow-xl transition-all active:scale-95"
                        >
                            <Download size={18} /> TELECHARGER LA LISTE (PDF)
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 items-start">

                    {/* COLONNE GAUCHE : LISTE */}
                    <div className="space-y-6">
                        {/* Carte Info Trajet */}
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Users size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="mb-2 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-2 text-orange-600">
                                    <MapPin size={14} strokeWidth={3} />
                                    ITINÉRAIRE DÉTAILLÉ
                                    </span>
                                    <span className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-700 ring-1 ring-orange-100">
                                        <CalendarDays size={14} strokeWidth={3} />
                                        {travelDateLabel}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                                    {route?.departure_city}
                                    <ChevronRight className="text-slate-300" size={32} />
                                    {route?.arrival_city}
                                </h1>
                                <div className="mt-4 flex items-center gap-6">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Heure</span>
                                        <span className="text-sm font-black text-slate-700">{route?.departure_time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <span className="text-xs font-bold text-emerald-400 uppercase">Passagers</span>
                                        <span className="text-sm font-black text-emerald-700">{passengerCount} confirmés</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tableau des Passagers */}
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-orange-500" size={40} />
                                    <p className="text-slate-400 font-bold animate-pulse uppercase text-xs tracking-widest">Synchronisation...</p>
                                </div>
                            ) : error ? (
                                <div className="m-8 p-6 bg-red-50 text-red-600 rounded-3xl font-bold flex items-center gap-3">
                                    <AlertCircle /> {error}
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                        <Users size={40} />
                                    </div>
                                    <p className="text-slate-400 font-bold">Aucune réservation sur ce trajet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sièges</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Paiement</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {groupedTickets.map((group) => (
                                                <React.Fragment key={group.date}>
                                                    {groupedTickets.length > 1 && (
                                                        <tr className="bg-orange-50/70">
                                                            <td colSpan={4} className="px-8 py-4">
                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-2 text-sm font-black text-orange-700">
                                                                        <CalendarDays size={16} />
                                                                        {group.label}
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                                                                        <span className="rounded-full bg-white px-3 py-1 text-slate-500 ring-1 ring-orange-100">
                                                                            {group.tickets.length} réservation(s)
                                                                        </span>
                                                                        <span className="rounded-full bg-white px-3 py-1 text-slate-500 ring-1 ring-orange-100">
                                                                            {group.seatsCount} siège(s)
                                                                        </span>
                                                                        <span className="rounded-full bg-white px-3 py-1 text-orange-700 ring-1 ring-orange-100">
                                                                            {group.amount.toLocaleString('fr-FR')} FCFA
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {group.tickets.map((ticket) => (
                                                        <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                    {ticket.transaction_id || `#${ticket.id}`}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="font-bold text-slate-800">{ticket.customer_name || ticket.client || '—'}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                    {groupedTickets.length > 1 ? group.label : 'Passager vérifié'}
                                                                </p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex flex-wrap justify-center gap-1">
                                                                    {normalizeSeats(ticket.seats).length > 0 ? normalizeSeats(ticket.seats).map(s => (
                                                                        <span key={`${ticket.id}-${s}`} className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-[10px] font-black border border-orange-200">
                                                                            {s}
                                                                        </span>
                                                                    )) : <span className="text-slate-400">—</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-sm font-black text-slate-900">{Number(ticket.amount || 0).toLocaleString()} <small>FCFA</small></span>
                                                                    <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-black uppercase">
                                                                        <CheckCircle2 size={10} /> Confirmé
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLONNE DROITE : PLAN BUS */}
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm sticky top-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-slate-900 text-white rounded-2xl">
                                <Armchair size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 leading-tight">
                                    {route?.bus?.name || 'Configuration'}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Occupation en temps réel</p>
                            </div>
                        </div>

                        <div className="mb-10 bg-slate-50 rounded-2xl p-4 flex justify-between">
                            <div className="text-center flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Total</p>
                                <p className="text-lg font-black text-slate-800">{allSeats.length}</p>
                            </div>
                            <div className="w-[1px] bg-slate-200" />
                            <div className="text-center flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Occupés</p>
                                <p className="text-lg font-black text-red-500">{reservedSeats.size}</p>
                            </div>
                            <div className="w-[1px] bg-slate-200" />
                            <div className="text-center flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Libres</p>
                                <p className="text-lg font-black text-emerald-500">{allSeats.length - reservedSeats.size}</p>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            {renderBusLayout()}
                        </div>

                        <div className="mt-10 space-y-3">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <Info size={16} className="text-orange-500" />
                                Appuyez sur un siège pour voir les détails (Bientôt disponible)
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </CompanyLayout>
    )
}

export default CompanyReservationDetails
