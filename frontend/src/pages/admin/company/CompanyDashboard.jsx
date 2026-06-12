import React, { useCallback, useEffect, useState } from 'react'
import {
    ArrowUpRight,
    Bus,
    CheckCircle2,
    Loader2,
    MapPinned,
    Users,
    Wallet,
    Calendar,
    LifeBuoy,
    Send,
    X,
    TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

function CompanyDashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [dateFilter, setDateFilter] = useState('today')
    const [supportOpen, setSupportOpen] = useState(false)
    const [supportForm, setSupportForm] = useState({ subject: '', message: '' })
    const [supportSending, setSupportSending] = useState(false)
    const [supportError, setSupportError] = useState('')
    const [supportSuccess, setSupportSuccess] = useState('')

    const loadStats = useCallback(() => {
        setLoading(true)
        setError('')
        api.get('/company/stats', {
            params: { period: dateFilter }
        })
            .then((res) => setStats(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Impossible de charger le dashboard compagnie'))
            .finally(() => setLoading(false))
    }, [dateFilter])

    useEffect(() => {
        Promise.resolve().then(loadStats)
    }, [loadStats])

    const grossSales = Number(stats?.grossSales || 0)
    const reservedSeats = Number(stats?.totalReservedSeats || 0)
    const totalRoutes = Number(stats?.totalRoutes || 0)
    const totalBuses = Number(stats?.totalBuses || 0)
    
    const periodHints = {
        today: {
            sales: "Ventes des départs d'aujourd'hui",
            seats: "Places réservées aujourd'hui",
        },
        thisWeek: {
            sales: 'Ventes des départs de la semaine',
            seats: 'Places réservées cette semaine',
        },
        thisMonth: {
            sales: 'Ventes des départs du mois',
            seats: 'Places réservées ce mois',
        },
        thisYear: {
            sales: "Ventes des départs de l'année",
            seats: "Places réservées cette année",
        },
    }
    const currentHints = periodHints[dateFilter] || periodHints.today

    const handleSupportSubmit = async (event) => {
        event.preventDefault()
        if (!supportForm.subject.trim() || !supportForm.message.trim() || supportSending) return

        setSupportSending(true)
        setSupportError('')
        setSupportSuccess('')

        try {
            const { data } = await api.post('/company/support-message', {
                subject: supportForm.subject.trim(),
                message: supportForm.message.trim(),
            })
            setSupportSuccess(data?.message || 'Votre demande a ete envoyee au support technique.')
            setSupportForm({ subject: '', message: '' })
        } catch (err) {
            setSupportError(err.response?.data?.message || "Impossible d'envoyer la demande au support.")
        } finally {
            setSupportSending(false)
        }
    }

    if (loading) {
        return (
            <CompanyLayout title="Dashboard" showHeaderSearch>
                <div className="flex h-[60vh] flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-3xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                    <Loader2 className="animate-spin text-orange-500" size={36} />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chargement de vos données...</p>
                </div>
            </CompanyLayout>
        )
    }

    return (
        <CompanyLayout title="Dashboard" showHeaderSearch>
            {error && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm font-medium text-red-600 backdrop-blur-sm">
                    {error}
                </div>
            )}

            {/* --- FILTRES DE PÉRIODE --- */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                {/* Filtres de gauche */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/40 backdrop-blur-sm w-fit dark:bg-slate-800 dark:border-slate-700">
                    <button
                        onClick={() => setDateFilter('today')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            dateFilter === 'today'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 dark:bg-slate-700 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Calendar size={16} />
                        Aujourd'hui
                    </button>
                    <button
                        onClick={() => setDateFilter('thisWeek')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            dateFilter === 'thisWeek'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 dark:bg-slate-700 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Calendar size={16} />
                        Cette semaine
                    </button>
                    <button
                        onClick={() => setDateFilter('thisMonth')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            dateFilter === 'thisMonth'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 dark:bg-slate-700 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Calendar size={16} />
                        Ce mois
                    </button>
                </div>

                {/* Filtre de droite (Annuel) */}
                <div className="flex items-center p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/40 backdrop-blur-sm w-fit dark:bg-slate-800 dark:border-slate-700">
                    <button
                        onClick={() => setDateFilter('thisYear')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            dateFilter === 'thisYear'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 dark:bg-slate-700 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Calendar size={16} />
                        Cette année
                    </button>
                </div>
            </div>

            {/* --- GRILLE PRINCIPALE --- */}
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <section className="space-y-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <StatCard
                            to="/company/wallet"
                            icon={Wallet}
                            label="Chiffre d'affaires"
                            value={grossSales}
                            money
                            hint={currentHints.sales}
                            badge="Wallet"
                            color="from-orange-500 to-orange-600"
                        />
                        <StatCard
                            to="/company/reservations"
                            icon={Users}
                            label="Clients servis"
                            value={reservedSeats}
                            hint={currentHints.seats}
                            badge="Reservations"
                            color="from-amber-500 to-amber-600"
                        />
                    </div>

                    {/* Graphique Chiffre d'affaires */}
                    <RevenueChart data={stats?.chartData} dateFilter={dateFilter} />
                </section>

                <aside className="space-y-6">
                    {/* CARTE DE BIENVENUE PREMIUM */}
                    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:shadow-slate-950/10">
                        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
                        
                        <div className="relative">
                            <p className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-orange-500 dark:text-orange-400">
                                <LifeBuoy size={15} />
                                Assistance technique
                            </p>
                            <h3 className="mt-3 text-2xl font-bold tracking-tight leading-snug text-slate-900 dark:text-white">
                                Besoin d'aide sur votre espace compagnie ?
                            </h3>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed dark:text-slate-400">
                                Signalez un probleme technique, une erreur de reservation ou une difficulte liee a vos trajets. Le super admin recevra votre demande en notification.
                            </p>

                            {!supportOpen ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSupportOpen(true)
                                        setSupportError('')
                                        setSupportSuccess('')
                                    }}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-orange-600 active:scale-[0.98]"
                                >
                                    Contacter l'assistance
                                    <ArrowUpRight size={16} />
                                </button>
                            ) : (
                                <form onSubmit={handleSupportSubmit} className="mt-5 space-y-3">
                                    {supportSuccess && (
                                        <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-100">
                                            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                                            {supportSuccess}
                                        </div>
                                    )}
                                    {supportError && (
                                        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-semibold text-red-100">
                                            {supportError}
                                        </div>
                                    )}
                                    <input
                                        value={supportForm.subject}
                                        onChange={(event) => setSupportForm((current) => ({ ...current, subject: event.target.value }))}
                                        placeholder="Sujet de la demande"
                                        maxLength={255}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                        required
                                    />
                                    <textarea
                                        value={supportForm.message}
                                        onChange={(event) => setSupportForm((current) => ({ ...current, message: event.target.value }))}
                                        placeholder="Decrivez le probleme rencontre"
                                        rows={5}
                                        maxLength={5000}
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={supportSending}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {supportSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                            Envoyer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSupportOpen(false)
                                                setSupportError('')
                                            }}
                                            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
                                            aria-label="Fermer le formulaire"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* VUE RAPIDE (Utilisation de SmallMetric précédemment inutilisé) */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm space-y-4 dark:border-slate-700 dark:bg-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Vue rapide de la flotte</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <SmallMetric to="/company/trajets" icon={MapPinned} label="Lignes" value={totalRoutes} badge="Trajets" color="from-orange-500 to-orange-600" />
                            <SmallMetric to="/company/buses" icon={Bus} label="Véhicules" value={totalBuses} badge="Flotte" color="from-slate-700 to-slate-800" />
                        </div>
                    </div>
                </aside>
            </div>
        </CompanyLayout>
    )
}

function RevenueChart({ data, dateFilter }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const chartData = data || [];
    const maxValue = Math.max(...chartData.map(d => Number(d.value || 0)), 0) || 1000;

    // Déterminer le nom en français du jour d'aujourd'hui
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const todayIndex = new Date().getDay();
    const todayName = daysOfWeek[todayIndex];

    return (
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm space-y-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 dark:text-slate-500">
                        <TrendingUp size={16} className="text-orange-500" />
                        Chiffre d'affaires
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Comparaison des ventes sur la période</p>
                </div>
                <div className="text-[10px] font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    Mis à jour en temps réel <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="flex h-60 items-center justify-center text-sm font-medium text-slate-400 dark:text-slate-500">
                    Aucune donnée disponible
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Grille de graphique */}
                    <div className="relative h-64 w-full">
                        {/* Lignes de repère */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                                <div key={idx} className="w-full flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400 w-16 text-right select-none dark:text-slate-500">
                                        {Math.round(maxValue * ratio).toLocaleString('fr-FR')} F
                                    </span>
                                    <div className="flex-1 border-b border-dashed border-slate-100 dark:border-slate-700" />
                                </div>
                            ))}
                        </div>

                        {/* Barres */}
                        <div className="absolute inset-x-0 bottom-0 top-3 left-20 right-4 flex items-end justify-between h-[calc(100%-12px)]">
                            {chartData.map((item, index) => {
                                const heightPercent = (Number(item.value || 0) / maxValue) * 100;
                                const isHovered = hoveredIndex === index;
                                const isToday = !!item.isToday || (dateFilter === 'today' && item.label === todayName);
                                const isThisWeek = dateFilter === 'thisWeek';
                                const tooltipLabel = isToday
                                    ? "Aujourd'hui"
                                    : (isThisWeek && item.date
                                        ? `${item.label} (${item.date})`
                                        : item.label);

                                return (
                                    <div
                                        key={index}
                                        className="flex flex-col items-center flex-1 group relative h-full justify-end px-1 sm:px-3"
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        <div className={`absolute bottom-0 w-full rounded-t-xl transition-all duration-300 ${isHovered ? 'h-[90%] bg-orange-500/10 blur-md' : 'h-0'}`} />
                                        <div
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                            className={`w-full max-w-[42px] rounded-t-lg bg-gradient-to-t transition-all duration-500 ease-out cursor-pointer ${
                                                isHovered
                                                    ? 'from-orange-600 to-orange-400 shadow-md shadow-orange-500/20'
                                                    : (isToday
                                                        ? 'from-orange-500 to-amber-400 border border-orange-400 ring-2 ring-orange-100'
                                                        : 'from-orange-500 to-orange-300')
                                            }`}
                                        />
                                        {isHovered && (
                                            <div className="absolute bottom-[calc(100%+8px)] z-10 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg border border-slate-800 flex flex-col items-center whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tooltipLabel}</span>
                                                <span className="mt-0.5 text-orange-400 text-sm font-bold">{Number(item.value || 0).toLocaleString('fr-FR')} FCFA</span>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Étiquettes de l'axe X */}
                    <div className="flex border-t border-slate-100 pt-4 pl-20 pr-4">
                        <div className="flex-1 flex justify-between items-start">
                            {chartData.map((item, index) => {
                                const isToday = !!item.isToday || (dateFilter === 'today' && item.label === todayName);
                                const isWeeklyOrDaily = dateFilter === 'today' || dateFilter === 'thisWeek';

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-1.5 transition-all duration-200" style={{ minWidth: 0 }}>
                                        {isWeeklyOrDaily ? (
                                            <>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                                    hoveredIndex === index ? 'text-orange-500' : (isToday ? 'text-orange-600 font-extrabold' : 'text-slate-400')
                                                }`}>
                                                    {isToday ? "Auj." : item.label.substring(0, 3)}
                                                </span>
                                                {item.date && (
                                                    <span className={`text-[11px] font-bold h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                                        isToday
                                                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 ring-2 ring-orange-100'
                                                            : (hoveredIndex === index
                                                                ? 'bg-orange-50 text-orange-600 border border-orange-200/60'
                                                                : 'bg-slate-50 text-slate-500 border border-slate-100')
                                                    }`}>
                                                        {item.date.split('/')[0]}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors truncate px-1 max-w-[64px] ${
                                                hoveredIndex === index ? 'text-orange-500' : 'text-slate-400'
                                            }`} title={item.label}>
                                                {dateFilter === 'thisMonth' ? item.label.substring(0, 3) + '.' : item.label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ to, icon: Icon, label, value, hint, money = false, badge = 'Statistique', color = 'from-orange-500 to-orange-600' }) {
    const content = (
        <>
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-5 transition-transform group-hover:scale-110`} />

            <div className="relative mb-4 flex items-start justify-between">
                <div className={`rounded-2xl bg-gradient-to-br ${color} p-3 text-white shadow-lg`}>
                    {React.createElement(Icon, { size: 24 })}
                </div>
                <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                    {badge}
                </span>
            </div>

            <div className="relative">
                <p className="mb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                <h4 className="flex items-baseline gap-1 text-2xl font-black text-slate-900 dark:text-white">
                    {Number(value || 0).toLocaleString('fr-FR')}
                    {money && <span className="text-xs font-bold text-orange-500">FCFA</span>}
                </h4>
                {hint && <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</p>}
            </div>

            <div className="relative mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div className={`h-full w-2/3 bg-gradient-to-r ${color} opacity-30 transition-opacity group-hover:opacity-100`} />
            </div>
        </>
    )

    const className = "group relative block overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100 dark:border-slate-700 dark:bg-slate-800"

    if (to) {
        return (
            <Link to={to} className={className}>
                {content}
            </Link>
        )
    }

    return (
        <div className={className}>
            {content}
        </div>
    )
}

function SmallMetric({ to, icon: Icon, label, value, badge = 'Statistique', color = 'from-orange-500 to-orange-600' }) {
    const content = (
        <>
            <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br ${color} opacity-5 transition-transform group-hover:scale-110`} />

            <div className="relative mb-3 flex items-start justify-between">
                <div className={`rounded-xl bg-gradient-to-br ${color} p-2.5 text-white shadow-md`}>
                    {React.createElement(Icon, { size: 18 })}
                </div>
                <span className="rounded-md bg-slate-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                    {badge}
                </span>
            </div>

            <div className="relative">
                <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{Number(value || 0).toLocaleString('fr-FR')}</p>
            </div>

            <div className="relative mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div className={`h-full w-2/3 bg-gradient-to-r ${color} opacity-30 transition-opacity group-hover:opacity-100`} />
            </div>
        </>
    )

    const className = "group relative block overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100 dark:border-slate-700 dark:bg-slate-800"

    if (to) {
        return (
            <Link to={to} className={className}>
                {content}
            </Link>
        )
    }

    return (
        <div className={className}>
            {content}
        </div>
    )
}

export default CompanyDashboard
