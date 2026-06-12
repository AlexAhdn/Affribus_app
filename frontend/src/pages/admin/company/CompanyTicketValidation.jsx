import React, { useState } from 'react'
import { CheckCircle2, QrCode, Search, ShieldCheck, XCircle } from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'
import { formatDate, formatMoney } from '../../../utils/ticket'
import { getSessionUser } from '../../../utils/auth'

const statusMeta = {
  valid: { title: 'Billet valide', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
  already_used: { title: 'Billet deja utilise', className: 'border-amber-200 bg-amber-50 text-amber-800', icon: XCircle },
  not_found: { title: 'Billet introuvable', className: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
  other_company: { title: "Billet d'une autre compagnie", className: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
  not_paid: { title: 'Billet non paye', className: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
  wrong_date: { title: 'Mauvaise date de voyage', className: 'border-amber-200 bg-amber-50 text-amber-800', icon: XCircle },
}

function Detail({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-900">{value || '-'}</p>
    </div>
  )
}

function CompanyTicketValidation() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const sessionUser = getSessionUser()
  const companyName = sessionUser?.company_name || sessionUser?.company?.name || sessionUser?.name || 'Votre Compagnie'
  const companyTicketExample = `${companyName.replace(/\s+/g, '')}-siims27JD`

  const handleSubmit = async (event) => {
    event.preventDefault()
    const value = identifier.trim()
    if (!value) return

    setLoading(true)
    setResult(null)

    try {
      const payload = value.includes('-') ? { numero_unique: value } : { transaction_id: value }
      const { data } = await api.post('/company/tickets/validate', payload)
      setResult(data)
    } catch (err) {
      setResult(err.response?.data || {
        status: 'not_found',
        message: 'Impossible de valider ce billet.',
      })
    } finally {
      setLoading(false)
    }
  }

  const meta = result ? (statusMeta[result.status] || statusMeta.not_found) : null
  const Icon = meta?.icon
  const ticket = result?.ticket
  const route = ticket?.route

  return (
    <CompanyLayout title="Validation billet">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-orange-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Controle guichet</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">Saisissez le numero unique ou la transaction du billet.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={`Ex: ${companyTicketExample}`}
              className="min-h-14 rounded-md border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            />
            <button disabled={loading} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-slate-900 px-6 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-600 disabled:opacity-60">
              <Search size={18} />
              {loading ? 'Validation...' : 'Valider'}
            </button>
          </form>

          {result && meta && (
            <div className={`mt-6 rounded-md border p-5 ${meta.className}`}>
              <div className="flex items-center gap-3">
                <Icon size={24} />
                <div>
                  <p className="text-lg font-black">{meta.title}</p>
                  <p className="text-sm font-bold opacity-80">{result.message}</p>
                </div>
              </div>
            </div>
          )}

          {ticket && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <Detail label="Client" value={ticket.client || ticket.customer_name} />
              <Detail label="Telephone" value={ticket.phone || ticket.customer_phone} />
              <Detail label="Passagers" value={(ticket.passenger_names || []).map((item) => item.name).join(', ') || ticket.customer_name} />
              <Detail label="Sieges" value={(ticket.seats || []).join(', ')} />
              <Detail label="Trajet" value={`${route?.departure_city || '-'} -> ${route?.arrival_city || '-'}`} />
              <Detail label="Date" value={formatDate(ticket.travel_date)} />
              <Detail label="Heure" value={route?.departure_time} />
              <Detail label="Montant" value={formatMoney(ticket.amount)} />
              <Detail label="Validation" value={ticket.validation_status || result.status} />
              <Detail label="Numero unique" value={ticket.numero_unique} />
            </div>
          )}
        </section>

        <aside className="h-fit rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-md bg-white text-slate-400">
            <QrCode size={38} />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-900">Scan QR code</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Emplacement prevu pour brancher la camera et scanner le QR code directement.</p>
        </aside>
      </div>
    </CompanyLayout>
  )
}

export default CompanyTicketValidation
