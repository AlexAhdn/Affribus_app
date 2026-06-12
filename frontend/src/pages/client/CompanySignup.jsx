import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Bus,
  CheckCircle2,
  ImagePlus,
  Lock,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import api from '../../api/api'

function CompanySignup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submittedCompany, setSubmittedCompany] = useState(null)
  const [saving, setSaving] = useState(false)

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0]
    setLogo(file || null)
    setLogoPreview(file ? URL.createObjectURL(file) : '')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmittedCompany(null)

    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name.trim())
      payload.append('email', form.email.trim())
      payload.append('address', form.address.trim())
      payload.append('phone', form.phone.trim())
      payload.append('password', form.password)
      payload.append('password_confirmation', form.password_confirmation)
      if (logo) {
        payload.append('logo', logo)
      }

      const { data } = await api.post('/companies/register', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSubmittedCompany({
        name: form.name.trim(),
        email: form.email.trim(),
      })
      setForm({
        name: '',
        email: '',
        address: '',
        phone: '',
        password: '',
        password_confirmation: '',
      })
      setLogo(null)
      setLogoPreview('')
      setSuccess(data?.message || 'Votre compagnie a ete inscrite. Elle sera accessible apres validation du superadmin.')
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      const firstError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null
      setError(firstError || err.response?.data?.message || 'Inscription impossible pour le moment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3 text-slate-900">
            <div className="rounded-3xl bg-orange-500 p-3 text-white shadow-lg shadow-orange-500/20">
              <Bus size={20} />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter">
              Afri<span className="text-orange-600">Bus</span>
            </span>
          </Link>
          <Link to="/" className="rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600">
            Retour à l’accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-12 lg:py-16">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl"></div>
          <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"></div>
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <aside className="relative z-10 flex flex-col justify-between gap-8">
              <div>
                <span className="inline-flex items-center rounded-full bg-orange-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-orange-300">
                  Espace partenaire
                </span>
                <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                  Gagnez en visibilité et optimisez vos ventes.
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                  Rejoignez AFRIBUS pour proposer vos trajets à une audience captée, gérer votre flotte depuis un seul tableau de bord et offrir une expérience de réservation premium à vos passagers.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.25)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Visibilité</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Mettez vos trajets en avant sur notre plateforme pour toucher plus de voyageurs.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.25)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Gestion</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Publiez vos horaires, gérez votre flotte et suivez vos réservations facilement.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.25)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Sécurité</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Paiements sécurisés et validation des billets en temps réel pour vos voyageurs.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.25)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Support</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Notre équipe vous accompagne à chaque étape de votre intégration.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/50">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-300">Prêt à lancer vos billets ?</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Laissez-nous vos informations et votre compagnie sera en ligne rapidement. Le contrôle total de vos trajets reste entre vos mains.
                </p>
              </div>
            </aside>

            <section className="relative z-10 rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8 md:p-10">
              <div className="mb-8">
                <p className="text-sm font-black uppercase tracking-[0.28em] text-orange-500">
                  Inscription compagnie
                </p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
                  Créez votre espace partenaire
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Remplissez le formulaire pour commencer à publier vos trajets et gérer vos réservations sur AFRIBUS.
                </p>
              </div>

              {success && (
                <div className="mb-8 rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-6 text-emerald-900">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                        Demande envoyee
                      </p>
                      <h3 className="mt-2 text-xl font-black text-slate-900">
                        Votre inscription est en attente de validation.
                      </h3>
                      <p className="mt-3 text-sm font-semibold leading-6 text-emerald-800">
                        {success}
                      </p>
                      {submittedCompany && (
                        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
                          Compagnie : {submittedCompany.name} - Email : {submittedCompany.email}
                        </p>
                      )}
                      <p className="mt-3 text-sm font-semibold leading-6 text-emerald-800">
                        Vous pourrez vous connecter a l'espace compagnie des que le superadmin aura valide votre demande.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                    {success}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    icon={Building2}
                    label="Nom de la compagnie"
                    value={form.name}
                    onChange={(value) => updateField('name', value)}
                    placeholder="Africa Tours"
                    autoComplete="organization"
                  />
                  <Field
                    icon={Mail}
                    label="Email professionnel"
                    type="email"
                    value={form.email}
                    onChange={(value) => updateField('email', value)}
                    placeholder="contact@compagnie.com"
                    autoComplete="email"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    icon={MapPin}
                    label="Adresse"
                    value={form.address}
                    onChange={(value) => updateField('address', value)}
                    placeholder="Cotonou, quartier..."
                    autoComplete="street-address"
                  />
                  <Field
                    icon={Phone}
                    label="Téléphone"
                    type="tel"
                    value={form.phone}
                    onChange={(value) => updateField('phone', value)}
                    placeholder="+229 01 00 00 00 00"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                    Logo de la compagnie (optionnel)
                  </label>
                  <label className="group flex min-h-[132px] cursor-pointer items-center gap-4 rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-orange-300 hover:bg-orange-50/40">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white text-slate-400 shadow-sm shadow-slate-300/10">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Aperçu du logo" className="h-full w-full object-cover" />
                      ) : (
                        <ImagePlus size={28} className="text-slate-400 transition group-hover:text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Téléversez votre logo</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Format PNG/JPG/WEBP, 2 Mo max. Vous pouvez aussi continuer sans logo.
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    icon={Lock}
                    label="Mot de passe"
                    type="password"
                    value={form.password}
                    onChange={(value) => updateField('password', value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <Field
                    icon={Lock}
                    label="Confirmer mot de passe"
                    type="password"
                    value={form.password_confirmation}
                    onChange={(value) => updateField('password_confirmation', value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 px-6 py-4 text-sm font-black uppercase tracking-[0.24em] text-white shadow-xl shadow-orange-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Inscription...' : 'Créer mon compte partenaire'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/admin/login"
                  className="font-bold text-orange-500 underline underline-offset-4 transition hover:text-orange-600"
                >
                  Connectez-vous
                </Link>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>
    </div>
  )
}

export default CompanySignup
