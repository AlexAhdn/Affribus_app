import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  Banknote,
  Bus,
  CalendarDays,
  CreditCard,
  Loader2,
  ReceiptText,
  Send,
  Ticket,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

const formatMoney = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`

function formatDate(value) {
  if (!value) return 'Date non definie'

  const date = new Date(String(value).slice(0, 10) + 'T12:00:00')
  if (Number.isNaN(date.getTime())) return 'Date non definie'

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function CompanyWallet() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawSent, setWithdrawSent] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'mobile_money',
    account: '',
    note: '',
  })

  useEffect(() => {
    api.get('/company/wallet')
      .then(({ data }) => setWallet(data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger le wallet'))
      .finally(() => setLoading(false))
  }, [])

  const transactions = useMemo(() => wallet?.transactions || [], [wallet])
  const totalSeats = transactions.reduce((sum, item) => sum + Number(item.seat_count || 0), 0)
  const requestedAmount = Number(withdrawForm.amount || 0)
  const canSubmitWithdrawal = requestedAmount > 0 && requestedAmount <= Number(wallet?.balance || 0) && withdrawForm.account.trim()

  const handleWithdrawSubmit = (event) => {
    event.preventDefault()
    if (!canSubmitWithdrawal) return

    setWithdrawSent(true)
    setWithdrawForm({ amount: '', method: 'mobile_money', account: '', note: '' })
  }

  const withdrawButton = (
    <button
      type="button"
      onClick={() => {
        setWithdrawOpen(true)
        setWithdrawSent(false)
      }}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
    >
      <Banknote size={16} />
      Retrait
    </button>
  )

  return (
    <CompanyLayout title="Wallet" headerAction={withdrawButton}>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={30} />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-[2rem] border border-red-100 bg-red-50 p-6 font-bold text-red-600">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl shadow-slate-200">
            <div className="grid gap-8 p-7 lg:grid-cols-[1fr_360px] lg:p-8">
              <div>
                <div className="mb-8 flex items-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30">
                    <Wallet size={26} />
                  </div>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Solde disponible</p>
                <h3 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                  {formatMoney(wallet?.balance)}
                </h3>
                <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-300">
                  Total des tickets payes, reserves en ligne ou saisis manuellement par votre compagnie.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <BalancePill
                  icon={CreditCard}
                  label="Reservations en ligne"
                  value={formatMoney(wallet?.online_total)}
                  meta={`${wallet?.online_count || 0} ticket(s)`}
                />
                <BalancePill
                  icon={Banknote}
                  label="Reservations manuelles"
                  value={formatMoney(wallet?.manual_total)}
                  meta={`${wallet?.manual_count || 0} ticket(s)`}
                />
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard icon={ReceiptText} label="Transactions" value={wallet?.total_transactions || 0} />
            <SummaryCard icon={Ticket} label="Places vendues" value={totalSeats} />
            <SummaryCard icon={ArrowDownLeft} label="Encaissements" value={formatMoney(wallet?.balance)} />
          </div>

          <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm lg:p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Transactions</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Tickets reserves</h3>
              </div>
              <p className="text-sm font-semibold text-slate-400">{transactions.length} operation(s)</p>
            </div>

            {transactions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-700">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 dark:bg-slate-600">
                  <ReceiptText size={26} />
                </div>
                <p className="font-black text-slate-800 dark:text-white">Aucune transaction pour le moment</p>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Les tickets payes apparaitront ici avec leur montant et leur mode de reservation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            )}
          </section>

          {withdrawOpen && (
            <WithdrawalModal
              balance={wallet?.balance}
              form={withdrawForm}
              sent={withdrawSent}
              canSubmit={canSubmitWithdrawal}
              onChange={setWithdrawForm}
              onClose={() => setWithdrawOpen(false)}
              onSubmit={handleWithdrawSubmit}
            />
          )}
        </div>
      )}
    </CompanyLayout>
  )
}

function BalancePill({ icon: Icon, label, value, meta }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-300">{label}</p>
          <p className="mt-1 text-lg font-black text-white">{value}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-orange-200">{meta}</p>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon size={20} />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function TransactionRow({ transaction }) {
  const methodIsManual = transaction.reservation_method === 'manual'
  const route = transaction.route

  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 transition hover:border-orange-100 hover:bg-orange-50/40 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-900/40 dark:hover:bg-slate-700">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
              methodIsManual ? 'bg-slate-900 text-white' : 'bg-orange-500 text-white'
            }`}>
              {methodIsManual ? 'Manuelle' : 'En ligne'}
            </span>
            <span className="text-xs font-bold text-slate-400">{transaction.transaction_id || `#${transaction.id}`}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <UserRound size={15} className="text-orange-500" />
              {transaction.customer_name || 'Passager'}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={15} className="text-orange-500" />
              {formatDate(transaction.travel_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Bus size={15} className="text-orange-500" />
              {route?.bus?.name || 'Bus'} {route?.bus?.registration_number ? `- ${route.bus.registration_number}` : ''}
            </span>
          </div>

          <p className="mt-2 text-base font-black text-slate-900 dark:text-white">
            {route?.departure_city || 'Depart'} <span className="text-orange-500">-</span> {route?.arrival_city || 'Arrivee'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 xl:min-w-64 dark:bg-slate-700">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Sieges</p>
            <p className="mt-1 font-black text-slate-900 dark:text-white">{transaction.seat_count || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Montant</p>
            <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{formatMoney(transaction.amount)}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function WithdrawalModal({ balance, form, sent, canSubmit, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Demande de retrait</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Retirer des fonds</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Solde disponible: {formatMoney(balance)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 text-sm font-bold text-emerald-700">
            Votre demande de retrait a ete preparee. Elle pourra etre traitee par l'equipe finance.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Montant
              </label>
              <input
                type="number"
                min="1"
                max={Number(balance || 0)}
                value={form.amount}
                onChange={(event) => onChange({ ...form, amount: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none transition focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                placeholder="Ex: 50000"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Moyen de retrait
              </label>
              <select
                value={form.method}
                onChange={(event) => onChange({ ...form, method: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none transition focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="mobile_money">Mobile money</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Paiement cash</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Compte ou numero
              </label>
              <input
                value={form.account}
                onChange={(event) => onChange({ ...form, account: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none transition focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                placeholder="Numero mobile money ou reference bancaire"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Note
              </label>
              <textarea
                value={form.note}
                onChange={(event) => onChange({ ...form, note: event.target.value })}
                className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none transition focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                placeholder="Information utile pour le traitement"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Send size={16} />
              Envoyer la demande
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default CompanyWallet
