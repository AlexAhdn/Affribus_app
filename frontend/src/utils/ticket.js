import { jsPDF } from 'jspdf'

export function getTicketUniqueNumber(ticket = {}, route = {}) {
  const companyName = ticket.company?.name || route.company?.name || 'Compagnie'
  const transactionId = ticket.transaction_id || 'TRX'
  return ticket.numero_unique || `${companyName}-${transactionId}`
}

export function normalizeTicketForView(ticket = {}, fallback = {}) {
  const route = ticket.route || fallback.route || {}
  const seats = Array.isArray(ticket.seats)
    ? ticket.seats
    : String(ticket.seats || fallback.seats || '').split(',').map((seat) => seat.trim()).filter(Boolean)
  const rawPassengers = ticket.passenger_names || fallback.passengerNames || []
  const passengerList = Array.isArray(rawPassengers)
    ? rawPassengers
    : Object.entries(rawPassengers).map(([seat, name]) => ({ seat, name }))

  return {
    route,
    seats,
    passengers: seats.map((seat, index) => {
      const passenger = passengerList.find((item) => String(item.seat) === String(seat))

      return {
        seat,
        label: `Passager ${index + 1}`,
        name: passenger?.name || (seats.length === 1 ? (ticket.customer_name || fallback.customerName) : '') || 'Passager',
      }
    }),
    transactionId: ticket.transaction_id || `AFB-${Date.now()}`,
    uniqueNumber: getTicketUniqueNumber(ticket, route),
    travelDate: ticket.travel_date || fallback.travelDate,
    amount: Number(ticket.amount || ticket.payment?.amount || 0),
  }
}

export function formatDate(value) {
  if (!value) return 'Date non definie'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`
}

export function isTicketUsed(ticket = {}) {
  return ticket.status === 'used' || ticket.validation_status === 'used' || Boolean(ticket.is_used)
}

export function getTicketStatusMeta(ticket = {}) {
  if (isTicketUsed(ticket)) {
    return {
      label: 'utilise',
      pdfLabel: 'UTILISE',
      className: 'bg-slate-100 text-slate-700',
    }
  }

  if (ticket.status === 'pending') {
    return {
      label: 'en attente',
      pdfLabel: 'ATTENTE',
      className: 'bg-amber-50 text-amber-700',
    }
  }

  if (ticket.status === 'cancelled') {
    return {
      label: 'annule',
      pdfLabel: 'ANNULE',
      className: 'bg-red-50 text-red-700',
    }
  }

  return {
    label: 'paye',
    pdfLabel: 'PAYE',
    className: 'bg-emerald-50 text-emerald-700',
  }
}

export function downloadTicketPdf({ ticket, route, qrCanvas, fallback = {} }) {
  const view = normalizeTicketForView(ticket, { ...fallback, route })
  const qrImage = qrCanvas?.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const left = 18
  const top = 18
  const ticketWidth = pdfWidth - (left * 2)
  const companyName = ticket.company?.name || route.company?.name || 'AFRIBUS'
  const status = getTicketStatusMeta(ticket).pdfLabel

  pdf.setFillColor(249, 115, 22)
  pdf.rect(left, top, ticketWidth, 3, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.4)
  pdf.roundedRect(left, top + 3, ticketWidth, 238, 2, 2, 'S')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(234, 88, 12)
  pdf.text('BILLET DE TRANSPORT', left + 10, top + 17)
  pdf.setFontSize(21)
  pdf.setTextColor(15, 23, 42)
  pdf.text(String(companyName).toUpperCase(), left + 10, top + 29)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`Reference: ${view.transactionId}`, left + 10, top + 38)

  pdf.setFillColor(240, 253, 244)
  pdf.setDrawColor(187, 247, 208)
  pdf.roundedRect(left + ticketWidth - 43, top + 15, 31, 14, 2, 2, 'FD')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(21, 128, 61)
  pdf.text(status, left + ticketWidth - 33, top + 24)

  pdf.setDrawColor(226, 232, 240)
  pdf.line(left + 10, top + 48, left + ticketWidth - 10, top + 48)
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text('DEPART', left + 10, top + 62)
  pdf.text('ARRIVEE', left + ticketWidth - 10, top + 62, { align: 'right' })
  pdf.setFontSize(20)
  pdf.setTextColor(15, 23, 42)
  pdf.text(String(view.route.departure_city || ''), left + 10, top + 76)
  pdf.text(String(view.route.arrival_city || ''), left + ticketWidth - 10, top + 76, { align: 'right' })
  pdf.setDrawColor(253, 186, 116)
  pdf.line(left + 62, top + 70, left + ticketWidth - 62, top + 70)
  pdf.setFillColor(255, 247, 237)
  pdf.circle(left + (ticketWidth / 2), top + 70, 6, 'F')
  pdf.setFontSize(12)
  pdf.setTextColor(234, 88, 12)
  pdf.text('>', left + (ticketWidth / 2), top + 74, { align: 'center' })

  const tableTop = top + 92
  const rowHeight = 12
  pdf.setFillColor(15, 23, 42)
  pdf.rect(left + 10, tableTop, ticketWidth - 20, 12, 'F')
  pdf.setFontSize(8)
  pdf.setTextColor(255, 255, 255)
  pdf.text('PASSAGER', left + 15, tableTop + 8)
  pdf.text('NOM', left + 52, tableTop + 8)
  pdf.text('SIEGE', left + ticketWidth - 17, tableTop + 8, { align: 'right' })

  view.passengers.forEach((passenger, index) => {
    const y = tableTop + 12 + (index * rowHeight)
    pdf.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255)
    pdf.rect(left + 10, y, ticketWidth - 20, rowHeight, 'F')
    pdf.setDrawColor(226, 232, 240)
    pdf.line(left + 10, y + rowHeight, left + ticketWidth - 10, y + rowHeight)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(234, 88, 12)
    pdf.text(passenger.label.toUpperCase(), left + 15, y + 8)
    pdf.setTextColor(15, 23, 42)
    pdf.text(String(passenger.name).toUpperCase(), left + 52, y + 8, { maxWidth: ticketWidth - 96 })
    pdf.text(String(passenger.seat), left + ticketWidth - 17, y + 8, { align: 'right' })
  })

  const detailsTop = tableTop + 22 + (view.passengers.length * rowHeight)
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(left + 10, detailsTop, ticketWidth - 20, 25, 2, 2, 'FD')
  pdf.line(left + (ticketWidth / 2), detailsTop, left + (ticketWidth / 2), detailsTop + 25)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text('DATE DU VOYAGE', left + 17, detailsTop + 9)
  pdf.text('DEPART PREVU', left + (ticketWidth / 2) + 8, detailsTop + 9)
  pdf.setFontSize(11)
  pdf.setTextColor(15, 23, 42)
  pdf.text(formatDate(view.travelDate), left + 17, detailsTop + 18)
  pdf.text(String(view.route.departure_time || ''), left + (ticketWidth / 2) + 8, detailsTop + 18)

  const qrTop = detailsTop + 45
  pdf.setDrawColor(203, 213, 225)
  pdf.setLineDashPattern([2, 2], 0)
  pdf.line(left + 10, qrTop - 14, left + ticketWidth - 10, qrTop - 14)
  pdf.setLineDashPattern([], 0)
  const qrSize = 42
  const qrX = left + (ticketWidth / 2) - (qrSize / 2)
  if (qrImage) pdf.addImage(qrImage, 'PNG', qrX, qrTop, qrSize, qrSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(15, 23, 42)
  pdf.text(view.uniqueNumber, left + (ticketWidth / 2), qrTop + qrSize + 8, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(100, 116, 139)
  pdf.text('Numero unique de validation', left + (ticketWidth / 2), qrTop + qrSize + 14, { align: 'center' })
  pdf.save(`Billet_${companyName}_${view.transactionId}.pdf`)
}
