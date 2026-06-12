import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import CompanyLayout from '../../../components/company/CompanyLayout'
import api from '../../../api/api'

const initialSubAccount = {
  name: '',
  email: '',
  phone: '',
  password: '',
  station_id: '',
}

function CompanySettings() {
  const [company, setCompany] = useState(null)
  const [subAccounts, setSubAccounts] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [subAccountForm, setSubAccountForm] = useState(initialSubAccount)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profileResponse, usersResponse] = await Promise.all([
          api.get('/company/profile'),
          api.get('/company/reservation-users'),
        ])
        const data = profileResponse.data
        setCompany(data)
        setSubAccounts(Array.isArray(usersResponse.data) ? usersResponse.data : [])
        setForm({
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || '',
          address: data?.address || '',
        })

        if (data?.id) {
          const stationsResponse = await api.get(`/stations/company/${data.id}`)
          const stationList = Array.isArray(stationsResponse.data) ? stationsResponse.data : []
          setStations(stationList)
          if (stationList.length === 1) {
            setSubAccountForm((prev) => ({ ...prev, station_id: String(stationList[0].id) }))
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de charger les parametres')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubAccountChange = (field, value) => {
    setSubAccountForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.patch('/company/profile', form)
      setCompany(data)
      setSuccess('Informations de la compagnie mises a jour.')

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...storedUser,
          name: data.name,
          email: data.email,
          company_name: data.name,
        })
      )
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstError = validationErrors ? Object.values(validationErrors).flat()[0] : null
      setError(firstError || err.response?.data?.message || 'Mise a jour impossible')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSubAccount = async (event) => {
    event.preventDefault()
    setCreatingAccount(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      const { data } = await api.post('/company/reservation-users', {
        ...subAccountForm,
        station_id: Number(subAccountForm.station_id),
      })
      setSubAccounts((prev) => [data.user, ...prev])
      setSubAccountForm({
        ...initialSubAccount,
        station_id: stations.length === 1 ? String(stations[0].id) : '',
      })
      setAccountSuccess('Sous-compte reservation cree avec succes.')
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstError = validationErrors ? Object.values(validationErrors).flat()[0] : null
      setAccountError(firstError || err.response?.data?.message || 'Creation du sous-compte impossible')
    } finally {
      setCreatingAccount(false)
    }
  }

  return (
    <CompanyLayout title="Parametre">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={30} />
        </div>
      ) : error && !company ? (
        <div className="flex items-center gap-3 rounded-[2rem] border border-red-100 bg-red-50 p-6 font-bold text-red-600">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm lg:p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-orange-600">
                  {company?.logo ? (
                    <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 size={28} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Profil compagnie</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{company?.name || 'Compagnie'}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-400">{company?.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatusPill icon={ShieldCheck} label="Statut" value={company?.status || 'active'} />
                <StatusPill icon={Users} label="Sous-comptes" value={subAccounts.length} />
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm lg:p-8 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-7 flex flex-col gap-2 border-b border-slate-100 pb-5 dark:border-slate-700">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Informations</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Modifier la compagnie</h3>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Coordonnees utilisees sur l'espace partenaire.</p>
              </div>

              {error && (
                <AlertBox tone="red" icon={AlertCircle} message={error} />
              )}
              {success && (
                <AlertBox tone="green" icon={CheckCircle2} message={success} />
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field icon={Building2} label="Nom de la compagnie" value={form.name} onChange={(value) => handleChange('name', value)} placeholder="Nom commercial" required />
                  <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => handleChange('email', value)} placeholder="contact@compagnie.com" required />
                  <Field icon={Phone} label="Telephone" value={form.phone} onChange={(value) => handleChange('phone', value)} placeholder="+229..." required />
                  <Field icon={MapPin} label="Adresse" value={form.address} onChange={(value) => handleChange('address', value)} placeholder="Ville, quartier, rue" />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Acces reservation</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Sous-compte</h3>
                <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Ce compte aura uniquement acces a la gestion des reservations.
                </p>
              </div>

              {accountError && <AlertBox tone="red" icon={AlertCircle} message={accountError} />}
              {accountSuccess && <AlertBox tone="green" icon={CheckCircle2} message={accountSuccess} />}

              <form onSubmit={handleCreateSubAccount} className="space-y-4">
                <Field icon={UserPlus} label="Nom du sous-compte" value={subAccountForm.name} onChange={(value) => handleSubAccountChange('name', value)} placeholder="Agent reservation" required />
                <Field icon={Mail} label="Email de connexion" type="email" value={subAccountForm.email} onChange={(value) => handleSubAccountChange('email', value)} placeholder="reservation@compagnie.com" required />
                <Field icon={Phone} label="Telephone" value={subAccountForm.phone} onChange={(value) => handleSubAccountChange('phone', value)} placeholder="+229..." />
                <Field icon={KeyRound} label="Mot de passe" type="password" value={subAccountForm.password} onChange={(value) => handleSubAccountChange('password', value)} placeholder="Minimum 6 caracteres" required />
                <SelectField
                  icon={MapPin}
                  label="Station rattachee"
                  value={subAccountForm.station_id}
                  onChange={(value) => handleSubAccountChange('station_id', value)}
                  required
                  disabled={stations.length === 0}
                >
                  <option value="">{stations.length === 0 ? 'Aucune station disponible' : 'Choisir une station'}</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.city})
                    </option>
                  ))}
                </SelectField>

                <button
                  type="submit"
                  disabled={creatingAccount}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {creatingAccount ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  {creatingAccount ? 'Creation...' : 'Creer le sous-compte'}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Comptes crees</h4>
                <div className="mt-4 space-y-3">
                  {subAccounts.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      Aucun sous-compte reservation pour le moment.
                    </p>
                  ) : (
                    subAccounts.map((account) => (
                      <div key={account.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700">
                        <p className="font-black text-slate-900 dark:text-white">{account.name}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{account.email}</p>
                        <p className="mt-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-600">
                          <MapPin size={13} />
                          {account.station ? `${account.station.name} - ${account.station.city}` : 'Station non definie'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </CompanyLayout>
  )
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        <Icon size={15} className="text-orange-500" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-orange-500 focus:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-700"
      />
    </label>
  )
}

function SelectField({ icon: Icon, label, value, onChange, children, required = false, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        <Icon size={15} className="text-orange-500" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:disabled:bg-slate-600"
      >
        {children}
      </select>
    </label>
  )
}

function StatusPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-orange-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">{label}</span>
      </div>
      <p className="mt-1 text-sm font-black capitalize text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function AlertBox({ tone, icon: Icon, message }) {
  const style = tone === 'green'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : 'border-red-100 bg-red-50 text-red-600'

  return (
    <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${style}`}>
      <Icon size={18} />
      {message}
    </div>
  )
}

export default CompanySettings
