import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock, AlertCircle, Bus } from 'lucide-react'
import api from '../../api/api'
import { setAuthSession } from '../../utils/auth'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data } = await api.post('/login', { email, password })

            if (data.user.role === 'client' && !data.user.company_id) {
                setError('Ce compte est un compte voyageur. Utilisez la connexion voyageur.')
                return
            }

            // 1. Stockage du token et des infos user
            setAuthSession(data, data.user.company_id ? 'company' : 'admin')

            // 2. Redirection intelligente selon le rôle
            if (data.user.role === 'company_reservation') {
                navigate('/company/reservations')
            } else if (data.user.company_id) {
                navigate('/company/dashboard')
            } else if (data.user.role === 'admin' || data.user.role === 'super_admin') {
                navigate('/admin/dashboard')
            } else {
                navigate('/') // Client lambda
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Identifiants invalides')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 p-8 md:p-12 border border-slate-100">

                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-orange-100 text-orange-600 rounded-3xl mb-4">
                        <Bus size={40} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">AfriBus</h1>
                    <p className="text-slate-500 font-medium mt-2">Accédez à votre espace de gestion</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input
                            type="email"
                            placeholder="Email professionnel"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 hover:bg-orange-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : 'Se connecter'}
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-400 text-sm font-medium">
                    Plateforme de réservation multi-compagnies
                </p>
                <p className="mt-5 text-center text-sm text-slate-600">
                    Vous n&apos;avez pas encore de compte ?{' '}
                    <Link
                        to="/inscription-compagnie"
                        className="font-bold text-orange-600 underline underline-offset-2 hover:text-orange-700"
                    >
                        Inscrivez-vous
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
