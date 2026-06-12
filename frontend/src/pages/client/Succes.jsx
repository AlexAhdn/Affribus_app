import React, { useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CheckCircle2, Home, Download, Calendar, Clock
} from 'lucide-react';
import { downloadTicketPdf, getTicketUniqueNumber } from '../../utils/ticket';
import { getSessionContext, isAuthenticated } from '../../utils/auth';

function Success() {
  const { state } = useLocation();
  const ticketRef = useRef(null);
  const homePath = isAuthenticated() && getSessionContext() === 'client' ? '/voyageur' : '/';

  if (!state || !state.route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <Link to={homePath} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">
          Retour a l'accueil
        </Link>
      </div>
    );
  }

  const { route, seats, travelDate, ticket, customerName } = state;
  const rawPassengerNames = ticket?.passenger_names || state.passengerNames || [];
  const seatList = Array.isArray(seats)
    ? seats
    : String(seats || '').split(',').map((seat) => seat.trim()).filter(Boolean);
  const passengerList = Array.isArray(rawPassengerNames)
    ? rawPassengerNames
    : Object.entries(rawPassengerNames).map(([seat, name]) => ({ seat, name }));
  const passengerRows = seatList.map((seat, index) => {
    const passenger = passengerList.find((item) => String(item.seat) === String(seat));

    return {
      seat,
      label: `Passager ${index + 1}`,
      name: passenger?.name || (seatList.length === 1 ? (ticket?.customer_name || customerName) : '') || 'Passager',
    };
  });
  const transactionId = ticket?.transaction_id || `AFB-${Date.now()}`;
  const qrUniqueNumber = getTicketUniqueNumber(ticket, route);
  const travelDateLabel = new Date(travelDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleDownloadPDF = async () => {
    try {
      const qrCanvas = ticketRef.current?.querySelector('canvas');
      downloadTicketPdf({ ticket, route, qrCanvas, fallback: { seats, travelDate, passengerNames: rawPassengerNames, customerName } });
    } catch (err) {
      console.error('Erreur generation PDF:', err);
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 font-sans">
      <div className="max-w-xl mx-auto print:hidden">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Paiement Reussi !</h1>
          <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-widest">Votre voyage est reserve</p>
        </div>

        <div
          ref={ticketRef}
          className="bg-white border border-slate-300 overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="h-2 bg-orange-500" style={{ backgroundColor: '#f97316' }}></div>

          <div className="p-8 space-y-7">
            <div className="flex items-start justify-between gap-8 border-b border-slate-200 pb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-600">Billet de transport</p>
                <h2 className="mt-2 text-2xl font-black uppercase leading-none text-slate-950">
                  {route.company?.name || 'AFRIBUS'}
                </h2>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ref: {transactionId}</p>
              </div>
              <div className="rounded-md border border-slate-200 px-4 py-3 text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Statut</p>
                <p className="mt-1 text-sm font-black uppercase text-green-700">Paye</p>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Depart</p>
                <p className="text-2xl font-black text-slate-950 leading-none">{route.departure_city}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-sm font-black text-orange-600">
                &gt;
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Arrivee</p>
                <p className="text-2xl font-black text-slate-950 leading-none">{route.arrival_city}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200">
              <div className="grid grid-cols-[88px_1fr_76px] bg-slate-900 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white">
                <span>Passager</span>
                <span>Nom</span>
                <span className="text-right">Siege</span>
              </div>
              <div className="divide-y divide-slate-100">
                {passengerRows.map((passenger) => (
                  <div
                    key={passenger.seat}
                    className="grid grid-cols-[88px_1fr_76px] items-center gap-3 bg-white px-4 py-3"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                      {passenger.label}
                    </span>
                    <span className="min-w-0 text-sm font-bold uppercase leading-tight text-slate-950">
                      {passenger.name}
                    </span>
                    <span className="text-right text-sm font-black uppercase text-slate-950">
                      {passenger.seat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-slate-200">
              <div className="flex items-center gap-3 border-r border-slate-200 bg-slate-50 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white"><Calendar size={18} color="#f97316" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Date du voyage</p>
                  <p className="font-black text-sm text-slate-950 leading-tight">
                    {travelDateLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white"><Clock size={18} color="#f97316" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Depart prevu</p>
                  <p className="font-black text-sm text-slate-950 leading-tight">{route.departure_time}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-6 text-center">
              <div className="mx-auto mb-3 inline-flex p-3 bg-white border border-slate-900 rounded-md">
                <QRCodeCanvas value={qrUniqueNumber} size={120} />
              </div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{qrUniqueNumber}</p>
              <p className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.24em]">Numero unique de validation</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-3 bg-white text-slate-900 border-2 border-slate-200 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Download size={18} /> Telecharger PDF
          </button>
          <Link
            to={homePath}
            className="flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-300 active:scale-95 transition-all"
          >
            <Home size={18} /> Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Success;
