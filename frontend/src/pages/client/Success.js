import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Printer, Home, Download, MapPin, Calendar, Clock, Ticket, User } from 'lucide-react';
import { getSessionContext, isAuthenticated } from '../../utils/auth';

function Success() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const homePath = isAuthenticated() && getSessionContext() === 'client' ? '/voyageur' : '/';

  // Sécurité si on accède à la page sans données
  if (!state || !state.route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Link to={homePath} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const { route, seats, travelDate, ticket } = state;

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* MESSAGE DE SUCCÈS */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-4 shadow-sm">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Paiement Réussi !</h1>
          <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-widest">
            Votre voyage est confirmé. Bonne route !
          </p>
        </div>

        {/* TICKET VIRTUEL */}
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
          
          {/* Haut du ticket (Orange) */}
          <div className="bg-orange-500 p-8 text-white text-center relative">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Billet de Transport</p>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                {route.company?.name || 'AFRIBUS'}
            </h2>
            {/* Décoration cercles sur les côtés */}
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-slate-100 rounded-full"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-slate-100 rounded-full"></div>
          </div>

          <div className="p-8 pt-10 space-y-8">
            {/* Trajet */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Départ</p>
                <p className="text-xl font-black text-slate-900">{route.departure_city}</p>
              </div>
              <div className="h-px flex-1 bg-slate-100 mx-4 border-dashed border-t-2"></div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Arrivée</p>
                <p className="text-xl font-black text-slate-900">{route.arrival_city}</p>
              </div>
            </div>

            {/* Infos Passager & Sièges */}
            <div className="grid grid-cols-2 gap-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><User size={18}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Passager</p>
                  <p className="font-bold text-sm uppercase">{ticket?.customer_name || 'Passager'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Ticket size={18}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sièges</p>
                  <p className="font-bold text-sm text-orange-600 uppercase tracking-tighter">{seats.join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Calendar size={18}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Date</p>
                  <p className="font-bold text-sm">{new Date(travelDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Clock size={18}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Heure</p>
                  <p className="font-bold text-sm">{route.departure_time}</p>
                </div>
              </div>
            </div>

            {/* Séparateur Pointillé Style Ticket */}
            <div className="relative border-t-2 border-dashed border-slate-200 py-4">
               <div className="absolute -left-12 -top-4 w-8 h-8 bg-slate-100 rounded-full border border-slate-200"></div>
               <div className="absolute -right-12 -top-4 w-8 h-8 bg-slate-100 rounded-full border border-slate-200"></div>
            </div>

            {/* QR Code Fictif / Référence */}
            <div className="flex flex-col items-center">
               <div className="w-32 h-32 bg-slate-100 rounded-xl mb-4 flex items-center justify-center border-2 border-slate-200 border-dashed">
                  <span className="text-[10px] font-black text-slate-400 uppercase text-center px-4 tracking-tighter">QR Code de validation</span>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Réf: {ticket?.transaction_id || 'TRX-XXXX'}</p>
            </div>
          </div>
        </div>

        {/* ACTIONS FINALES */}
        <div className="mt-10 grid grid-cols-2 gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-3 bg-white text-slate-900 border-2 border-slate-200 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
          >
            <Printer size={18} /> Imprimer
          </button>
          
          <Link 
            to={homePath}
            className="flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-slate-200"
          >
            <Home size={18} /> Accueil
          </Link>
        </div>

        <p className="text-center text-slate-400 text-[10px] font-bold mt-8 uppercase tracking-widest">
           Un email de confirmation vous a été envoyé.
        </p>
      </div>
    </div>
  );
}

export default Success;
