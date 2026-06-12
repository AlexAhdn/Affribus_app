import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/api'
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

function Payment() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ 1. CRÉER BOOKING (pending)
      const { data } = await api.post('/bookings', {
        route_id: state.route.id,
        travel_date: state.travelDate,
        seats: state.seats,
        first_name: state.first_name,
        last_name: state.last_name,
        email: state.email
      })

      const bookingId = data.id

      // ✅ 2. SIMULATION PAIEMENT (à remplacer par vrai paiement plus tard)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // ✅ 3. CONFIRMER PAIEMENT
      await api.post(`/bookings/${bookingId}/confirm`)

      // ✅ 4. REDIRECTION SUCCESS
      navigate('/success', {
        state: { booking: data }
      })

    } catch (err) {
      console.error(err)

      // ⚠️ erreur backend (ex: siège déjà pris)
      if (err.response?.status === 409) {
        setError("Un siège vient d'être réservé par quelqu’un d’autre 😢")
      } else {
        setError("Erreur lors du paiement")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!state) {
    return <div className="p-10 text-center">Session expirée</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center">
        
        <CreditCard size={40} className="mx-auto text-orange-500 mb-4" />
        
        <h1 className="text-2xl font-black mb-4">Paiement</h1>

        <p className="text-slate-500 mb-6">
          Total : <span className="font-bold text-slate-900">
            {Number(state.total).toLocaleString('fr-FR')} FCFA
          </span>
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-orange-600 transition"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Paiement...
            </>
          ) : (
            "Payer maintenant"
          )}
        </button>

      </div>
    </div>
  )
}

export default Payment