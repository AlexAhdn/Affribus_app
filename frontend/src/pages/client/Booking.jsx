import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Bus, Clock, AlertCircle, Loader2, ChevronLeft, Armchair, CalendarDays } from 'lucide-react';
import api from '../../api/api';


function formatPrice(value) {
  const n = Number(value ?? 0);
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

function formatTime(time) {
  return time ?? '—';
}

// Fonction pour formater la date en haut du bus
function formatDate(dateStr) {
  if (!dateStr) return 'Date non définie';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function Booking() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // On récupère la date transmise depuis Companies
  const initialTravelDate = location.state?.date || searchParams.get('date') || '';

  const [route, setRoute] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [travelDate, setTravelDate] = useState(initialTravelDate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Remplace ton useEffect actuel par celui-ci :
  useEffect(() => {
    if (!routeId) return;

    async function fetchSeats() {
      setLoading(true);
      setError(null);
      try {
        // 🚀 On envoie la date à l'API pour savoir quels sièges sont pris ce jour-là
        const { data } = await api.get(`/routes/${routeId}/seats${travelDate ? `?date=${travelDate}` : ''}`);
        

        setRoute({
          id: routeId,
          departure_city: data.departure_city,
          arrival_city: data.arrival_city,
          departure_time: data.departure_time,
          arrival_time: data.arrival_time,
          price: Number(data.price ?? 0),
          company: data.company,
        });

        setSeats(data.seats);
        setSelectedSeats([]);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les sièges.');
      } finally {
        setLoading(false);
      }
    }

    fetchSeats();
  }, [routeId, travelDate]); // Ajout de travelDate ici

  const toggleSeat = (number) => {
    setSelectedSeats((prev) =>
      prev.includes(number)
        ? prev.filter((n) => n !== number)
        : [...prev, number]
    );
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Veuillez sélectionner au moins un siège.');
      return;
    }
    if (!travelDate) {
      alert('Veuillez choisir une date de voyage.');
      return;
    }

    // ON TRANSMET TOUT AU CHECKOUT
    navigate(`/checkout/${routeId}`, {
      state: {
        seats: selectedSeats,
        route: route,
        date: travelDate // 🚀 La date continue son voyage !
      },
    });
  };

  const totalPrice = selectedSeats.length * (route?.price ?? 0);

  const renderSeat = (seat) => {
    const isSelected = selectedSeats.includes(seat.number);
    const isReserved = !seat.available;

    return (
      <button
        key={seat.number}
        disabled={isReserved}
        onClick={() => toggleSeat(seat.number)}
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-t-xl border-b-4 transition-all duration-200
          ${isReserved
            ? 'bg-red-500 border-red-700 text-red-100 cursor-not-allowed opacity-80'
            : isSelected
              ? 'bg-orange-500 border-orange-700 text-white scale-110 shadow-lg z-10'
              : 'bg-white border-slate-300 text-slate-600 hover:border-orange-400 hover:text-orange-500'}
        `}
      >
        <Armchair size={20} />
        <span className="absolute -bottom-6 text-[10px] font-bold text-slate-500">
          {seat.number}
        </span>
      </button>
    );
  };

  const renderBusLayout = () => {
    const rows = [];
    for (let i = 0; i < seats.length; i += 4) {
      const rowSeats = seats.slice(i, i + 4);
      rows.push(
        <div key={i} className="flex justify-center gap-8 mb-8">
          <div className="flex gap-3">
            {rowSeats.slice(0, 2).map(renderSeat)}
          </div>
          <div className="flex gap-3">
            {rowSeats.slice(2, 4).map(renderSeat)}
          </div>
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-orange-600">
            <ChevronLeft size={20} /> Retour
          </button>
          <div className="flex items-center gap-2">
            <Bus className="text-orange-500" />
            <span className="font-black uppercase italic">Afri<span className="text-orange-500">Bus</span></span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Analyse du plan de bus...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-red-700">
            <AlertCircle /> {error}
          </div>
        ) : (
          <>
            {/* CARD TRAJET */}
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-slate-200 mb-8 group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                        {route.company?.name || 'Compagnie'}
                      </span>
                      {/* AFFICHAGE DE LA DATE ICI */}
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                        <CalendarDays size={12} className="text-orange-500" />
                        {formatDate(travelDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-white"></div>
                        <div className="w-0.5 h-8 bg-slate-200 border-dashed border-l"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase leading-none mb-1 tracking-widest">Départ</p>
                          <h2 className="text-xl font-black text-slate-800 leading-none">{route.departure_city}</h2>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase leading-none mb-1 tracking-widest">Arrivée</p>
                          <h2 className="text-xl font-black text-slate-800 leading-none">{route.arrival_city}</h2>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-2xl">
                      <Clock size={18} className="text-orange-500" />
                      <span className="text-lg font-black">{formatTime(route.departure_time)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Prix Unitaire</p>
                      <div className="text-2xl font-black text-orange-600">
                        {formatPrice(route.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-3xl border border-orange-100 bg-orange-50 p-5">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-orange-600">
                Date du voyage
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(event) => setTravelDate(event.target.value)}
                className="w-full rounded-2xl border border-orange-200 bg-white p-4 font-black text-slate-900 outline-none focus:border-orange-500 md:max-w-xs"
                required
              />
            </div>

            <div className="mb-6 text-center">
              <p className="font-black text-slate-700 uppercase tracking-tighter text-lg">Sélectionnez vos sièges</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cliquez sur les places disponibles</p>
            </div>

            {/* BUS LAYOUT */}
            <div className="relative mx-auto max-w-[320px] bg-white rounded-[3rem] border-[8px] border-slate-200 shadow-2xl pb-10 overflow-hidden">
              <div className="h-16 bg-slate-900 mb-10 flex items-center justify-center">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
              </div>
              <div className="absolute inset-y-0 left-1/2 w-10 bg-slate-50 -translate-x-1/2 top-24"></div>
              <div className="relative z-10 px-6">
                {renderBusLayout()}
              </div>
            </div>

            {/* LÉGENDE */}
            <div className="mt-8 flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-slate-200 rounded"></div>
                Libre
              </div>
              <div className="flex items-center gap-2 text-orange-500">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                Choisi
              </div>
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                Occupé
              </div>
            </div>
          </>
        )}
      </main>

      {/* FOOTER BARRE DE PRIX */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-[60]">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em] mb-1">
                {selectedSeats.length} Siège(s) sélectionné(s)
              </p>
              <p className="text-3xl font-black">
                {formatPrice(totalPrice)}
              </p>
            </div>

            <button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0}
              className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;
