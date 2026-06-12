import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bus, Lock, Mail, ArrowRight } from 'lucide-react'
import { login } from '../../utils/auth'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/voyageur'
  const registeredEmail = location.state?.registered ? location.state?.email : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-900">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <Bus size={20} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">
              Afri<span className="text-orange-600">Bus</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-bold text-slate-500 hover:text-orange-600">
            Retour
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                Connexion voyageur
              </h1>
              <p className="text-slate-500 text-sm">
                Connectez-vous pour acceder a votre historique de reservations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {registeredEmail && (
                <p className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  Compte cree avec succes. Connectez-vous avec {registeredEmail}.
                </p>
              )}

              {error && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  E-mail ou telephone
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com ou +229..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition shadow-lg shadow-orange-200 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Pas encore de compte ?{' '}
              <Link
                to="/inscription"
                className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Login
