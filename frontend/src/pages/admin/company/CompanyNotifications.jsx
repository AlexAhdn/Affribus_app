import React, { useEffect, useState } from 'react'
import { AlertCircle, Bell, CalendarDays, CheckCheck, CheckCircle2, Loader2, MapPin } from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

function formatDate(value) {
  if (!value) return 'Date non definie'

  const date = new Date(String(value).slice(0, 10) + 'T12:00:00')
  if (Number.isNaN(date.getTime())) return 'Date non definie'

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatCreatedAt(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function publishUnreadCount(count) {
  window.dispatchEvent(new CustomEvent('company-notifications:unread-count', {
    detail: { count: Math.max(0, Number(count) || 0) },
  }))
}

function CompanyNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [marking, setMarking] = useState(false)
  const [readingIds, setReadingIds] = useState([])

  const loadNotifications = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/company/notifications', {
        params: { per_page: 50 },
      })
      const page = data.notifications
      setNotifications(Array.isArray(page) ? page : (page?.data || []))
      const nextUnreadCount = Number(data.unread_count || 0)
      setUnreadCount(nextUnreadCount)
      publishUnreadCount(nextUnreadCount)
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAllAsRead = async () => {
    if (unreadCount === 0 || marking) return

    setMarking(true)
    try {
      await api.patch('/company/notifications/read-all')
      setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })))
      setUnreadCount(0)
      publishUnreadCount(0)
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre a jour les notifications')
    } finally {
      setMarking(false)
    }
  }

  const markAsRead = async (notification) => {
    if (!notification || notification.read_at || readingIds.includes(notification.id)) return

    setError('')
    setReadingIds((ids) => [...ids, notification.id])

    try {
      const { data } = await api.patch(`/company/notifications/${notification.id}/read`)
      const readAt = data?.read_at || new Date().toISOString()

      setNotifications((items) => items.map((item) => (
        item.id === notification.id ? { ...item, read_at: readAt } : item
      )))
      setUnreadCount((count) => {
        const nextUnreadCount = Math.max(0, count - 1)
        publishUnreadCount(nextUnreadCount)
        return nextUnreadCount
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre a jour la notification')
    } finally {
      setReadingIds((ids) => ids.filter((id) => id !== notification.id))
    }
  }

  return (
    <CompanyLayout title="Notifications">
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Bell size={26} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Centre de notifications</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Chaque nouvelle reservation apparait ici avec le trajet concerne.
              </p>
            </div>
          </div>

          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || marking}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {marking ? <Loader2 className="animate-spin" size={16} /> : <CheckCheck size={16} />}
            Tout lire
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="animate-spin text-orange-500" size={36} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Chargement...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            <AlertCircle size={18} /> {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-700">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 dark:bg-slate-600">
              <Bell size={30} />
            </div>
            <h4 className="font-black text-slate-800 dark:text-white">Aucune notification pour le moment</h4>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Les prochaines reservations confirmees seront listees ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const unread = !notification.read_at
              const reading = readingIds.includes(notification.id)

              return (
                <article
                  key={notification.id}
                  role={unread ? 'button' : undefined}
                  tabIndex={unread ? 0 : undefined}
                  aria-label={unread ? `Marquer comme lue: ${notification.title}` : undefined}
                  onClick={() => markAsRead(notification)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      markAsRead(notification)
                    }
                  }}
                  className={`relative overflow-hidden rounded-3xl border p-5 transition ${
                    unread
                      ? 'cursor-pointer border-orange-100 bg-orange-50/60 shadow-sm hover:border-orange-200 hover:bg-orange-50 dark:border-orange-900/40 dark:bg-orange-900/10 dark:hover:bg-orange-900/20'
                      : 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      unread ? 'bg-orange-500 text-white' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {reading ? <Loader2 className="animate-spin" size={22} /> : <CheckCircle2 size={22} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-black text-slate-900 dark:text-white">{notification.title}</h4>
                            {unread && (
                              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                                Nouveau
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{notification.message}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {formatCreatedAt(notification.created_at)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                        {notification.route_label && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-600 ring-1 ring-slate-100 dark:bg-slate-600 dark:text-slate-300 dark:ring-slate-600">
                            <MapPin size={12} className="text-orange-500" />
                            {notification.route_label}
                          </span>
                        )}
                        {notification.travel_date && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-600 ring-1 ring-slate-100 dark:bg-slate-600 dark:text-slate-300 dark:ring-slate-600">
                            <CalendarDays size={12} className="text-orange-500" />
                            {formatDate(notification.travel_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}

export default CompanyNotifications
