import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../../assets/hero.png';
import api from '../../api/api';
import {
  MapPin,
  CalendarDays,
  Search,
  Bus,
  Phone,
  Mail,
  ArrowRight,
  Ticket,
  Map,
  Car,
  Send,
  Menu,
  X,
  ArrowLeftRight,
  ChevronRight
} from 'lucide-react';

function Home() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const navigate = useNavigate();
  const reservationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCities() {
      try {
        const { data } = await api.get('/cities');
        if (!isMounted) return;
        const cityList = Array.isArray(data) ? data : data?.data || [];
        setCities(cityList.filter((city) => city?.name));
        setCitiesError('');
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setCities([]);
        setCitiesError('Impossible de charger les villes.');
      } finally {
        if (isMounted) setCitiesLoading(false);
      }
    }
    fetchCities();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['accueil', 'apropos', 'reservation', 'services', 'partenaires', 'contact'];
      const scrollPos = window.scrollY + 100;
      
      for (let section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (from === to) { alert("Départ et destination ne peuvent pas être identiques"); return; }
    if (from && to && date) navigate(`/companies/${from}/${to}?date=${date}`);
  };

  const swapCities = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  const handleContactChange = (field, value) => {
    setContactForm((current) => ({ ...current, [field]: value }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactSubmitting(true);
    setContactStatus({ type: '', message: '' });

    try {
      await api.post('/contact-messages', contactForm);
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setContactStatus({ type: 'success', message: 'Message envoye. Notre equipe vous repondra rapidement.' });
    } catch (err) {
      setContactStatus({
        type: 'error',
        message: err.response?.data?.message || "Impossible d'envoyer le message pour le moment.",
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  const services = [
    {
      title: "Réservation de Tickets",
      desc: "Réservez vos places en avance parmi plus de 50 compagnies partenaires au meilleur prix.",
      img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
      icon: <Ticket size={22} />
    },
    {
      title: "Tourisme & Loisirs",
      desc: "Découvrez les plus beaux sites du pays avec nos circuits touristiques organisés et guidés.",
      img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
      icon: <Map size={22} />
    },
    {
      title: "Location de Bus",
      desc: "Besoin d'un bus privé pour un événement ou un voyage de groupe ? Louez en un clic.",
      img: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop",
      icon: <Car size={22} />
    }
  ];

  const partners = ["COMPAGNIE A", "TRAVEL PLUS", "EXPRESS VOYAGE", "CITY BUS", "AFRICA TOURS", "VIP TRANS", "TRANS-SAHEL"];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      <style>{`
        * { font-family: ui-sans-serif, system-ui, sans-serif; box-sizing: border-box; }

        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker { animation: ticker 28s linear infinite; }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-down { animation: fadeDown 0.3s ease forwards; }

        .search-card {
          background: #0f1a2e;
          border-radius: 32px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .search-title {
          color: white;
          font-weight: 800;
          font-size: clamp(1.5rem, 2.3vw, 2.5rem);
          letter-spacing: -0.02em;
        }

        .search-label {
          font-size: 0.65rem;
          letter-spacing: 0.22em;
          font-weight: 700;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          margin-bottom: 0.55rem;
          display: block;
        }

        .search-control {
          width: 100%;
          background: #1c2a3e;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 22px;
          padding: 14px 46px 14px 16px;
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }

        .search-control:focus {
          border-color: #ff5500;
          box-shadow: 0 0 0 4px rgba(255,85,0,0.18);
        }

        p {
          font-size: 1rem;
          line-height: 1.8;
        }

        .search-control::placeholder {
          color: rgba(255,255,255,0.55);
        }

        .search-input-group {
          position: relative;
        }

        .search-icon-left,
        .search-icon-right {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.65);
          pointer-events: none;
        }

        .search-icon-left { left: 14px; }
        .search-icon-right { right: 14px; }

        .search-button {
          width: 100%;
          border-radius: 999px;
          background: #ff5500;
          color: white;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 16px 22px;
          border: none;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          transition: background-color 0.2s, transform 0.2s;
          cursor: pointer;
        }

        .search-button:hover { background: #ff6f22; transform: translateY(-1px); }
        .search-button:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-moz-calendar-picker-indicator {
          opacity: 0;
          pointer-events: none;
        }

        .nav-link-btn {
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          cursor: pointer;
          padding: 4px 0;
          position: relative;
          transition: color 0.2s;
        }
        .nav-link-btn:hover { color: #f97316; }
        .nav-link-btn.active { color: #f97316; font-weight: 700; }

        .service-img { transition: transform 0.5s ease; }
        .service-card:hover .service-img { transform: scale(1.05); }

        .stat-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
      `}</style>

      {/* ══════════════════════ NAVBAR ══════════════════════ */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection('accueil')}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Bus color="white" size={16} strokeWidth={2.5} />
            </div>
            <span className="text-slate-900 font-black text-lg tracking-tight">AFRIBUS</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {[['accueil', 'Accueil'], ['apropos', 'Compagnie'], ['services', 'Services'], ['contact', 'Contact']].map(([id, label]) => (
              <button key={id} onClick={() => scrollToSection(id)} className={`nav-link-btn ${activeSection === id ? 'active' : ''}`}>{label}</button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="hidden sm:block bg-slate-900 hover:bg-[#f97316] text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-2xl transition shadow-lg shadow-slate-200 hover:shadow-orange-200">
              Se connecter
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-slate-900">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-[#0f1a2e] border-t border-white/10 fade-down">
            <div className="flex flex-col px-6 py-4 gap-1">
              {[['accueil', 'Accueil'], ['apropos', 'Compagnie'], ['services', 'Services'], ['contact', 'Contact']].map(([id, label]) => (
                <button key={id} onClick={() => scrollToSection(id)}
                  className={`text-left font-bold py-3 border-b border-white/10 text-sm transition ${
                    activeSection === id ? 'text-[#ff5500]' : 'text-white/80 hover:text-[#ff5500]'
                  }`}>{label}</button>
              ))}
              <button onClick={() => navigate('/login')} className="mt-4 bg-[#ff5500] hover:bg-orange-400 text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest transition">
                Se connecter
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════ HERO + SEARCH CARD ══════════════════════ */}
      <section id="accueil" style={{ paddingTop: '64px' }}>

        {/* Image plein-largeur */}
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(380px, 55vh, 620px)' }}>
          <img src={heroImage} alt="Voyage en bus AFRIBUS" className="w-full h-full object-cover object-center" />
          {/* Dégradé pour titre */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.25) 55%, transparent 100%)' }}></div>

        </div>

        {/* ── CARD DE RECHERCHE chevauchante ── */}
        <div id="reservation" ref={reservationRef} className="relative z-10 px-4 sm:px-6 -mt-12 md:-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="search-card overflow-hidden"
              style={{ boxShadow: '0 8px 48px rgba(15,23,42,0.22), 0 1px 0 rgba(255,255,255,0.04)' }}>
              <form onSubmit={handleSearch}>
                {/* Titre */}
                <div className="px-6 pt-6 pb-4">
                  <h2 className="search-title">
                    <span>Où allez-vous </span>
                    <span className="text-[#ff5500]">aujourd'hui</span>
                    <span> ?</span>
                  </h2>
                </div>

                <div className="grid gap-4 px-6 pb-6 md:grid-cols-3">

                  {/* PARTIR */}
                  <div>
                    <label className="search-label">PARTIR</label>
                    <div className="search-input-group">
                      <select value={from} onChange={e => setFrom(e.target.value)}
                        disabled={citiesLoading} required
                        className="search-control pr-11">
                        <option value="">{citiesLoading ? 'Chargement des villes...' : 'Ville de départ'}</option>
                        {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <MapPin size={18} className="search-icon-right" />
                    </div>
                  </div>

                  {/* ARRIVÉE */}
                  <div>
                    <label className="search-label">ARRIVÉE</label>
                    <div className="search-input-group">
                      <select value={to} onChange={e => setTo(e.target.value)}
                        disabled={citiesLoading} required
                        className="search-control pr-11">
                        <option value="">{citiesLoading ? 'Chargement des villes...' : "Ville d'arrivée"}</option>
                        {cities.map(c => <option key={c.id} value={c.name} disabled={c.name === from}>{c.name}</option>)}
                      </select>
                      <MapPin size={18} className="search-icon-right" />
                    </div>
                  </div>

                  {/* DATE */}
                  <div>
                    <label className="search-label">DATE</label>
                    <div className="search-input-group">
                      <CalendarDays size={18} className="search-icon-left" />
                      <input type="date" placeholder="jj/mm/aaaa" value={date} onChange={e => setDate(e.target.value)} required
                        className="search-control pl-11 bg-[#17243d]" />
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button type="submit"
                    disabled={citiesLoading || cities.length === 0}
                    className="search-button">
                    <Search size={18} /> RECHERCHER UN BILLET
                  </button>
                </div>

                {citiesError && (
                  <p className="px-6 pb-4 text-sm text-red-400 font-medium">{citiesError}</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Fond blanc de transition */}
        <div className="bg-white h-10"></div>
      </section>

      {/* ══════════════════════ STATS ══════════════════════ */}
      <section className="bg-white pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4 md:gap-6">
          {[
            { n: '50+', label: 'Compagnies partenaires', icon: <Bus size={20} /> },
            { n: '200+', label: 'Trajets disponibles', icon: <Map size={20} /> },
            { n: '24h', label: 'Support client', icon: <Phone size={20} /> },
          ].map(({ n, label, icon }) => (
            <div key={label} className="stat-card flex flex-col items-center text-center p-5 md:p-7 rounded-2xl bg-slate-50 border border-slate-100 cursor-default">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3 flex-shrink-0">{icon}</div>
              <div className="text-2xl md:text-3xl font-black text-slate-900">{n}</div>
              <div className="text-[11px] md:text-xs font-medium text-slate-400 mt-1 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ À PROPOS ══════════════════════ */}
      <section id="apropos" className="bg-[#0f1a2e] py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1200&auto=format&fit=crop"
              alt="Bus moderne" className="w-full rounded-2xl object-cover" style={{ height: '420px' }} />
            <div className="absolute -bottom-5 -right-5 bg-orange-500 text-white rounded-2xl px-6 py-4 shadow-xl hidden md:block">
              <div className="text-2xl font-black">+5 ans</div>
              <div className="text-xs font-medium opacity-80">d'expérience</div>
            </div>
          </div>

          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full mb-5">
              À propos de nous
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
              Vous êtes une compagnie ?
            </h2>
            <div className="space-y-4 text-white text-sm leading-7 mb-8">
              <p>Nous mettons à votre disposition une solution simple et efficace pour réduire vos coûts et moderniser votre service. Plus besoin de site web à entretenir, ni de frais de maintenance ou d'impression de tickets papier.</p>
              <p>Offrez à vos clients une expérience fluide avec la réservation en ligne et le choix des sièges, tout en gardant un contrôle total sur vos opérations : gestion de vos trajets, des horaires, des tarifs, des réservations et des ventes en temps réel.</p>
              <p>Cela vous fait gagner en efficacité, améliore l'expérience de vos clients et augmente vos ventes. Rejoignez-nous dès aujourd'hui.</p>
            </div>
            <button onClick={() => navigate('/inscription-compagnie')}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-orange-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition">
              Devenir partenaire <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════ SERVICES ══════════════════════ */}
      <section id="services" className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Ce que nous proposons</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">Nos Services</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">Un partenaire de voyage complet à vos côtés.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div key={i} className="service-card group rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="overflow-hidden" style={{ height: '220px' }}>
                  <img src={s.img} alt={s.title} className="service-img w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-4">{s.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">{s.desc}</p>
                  <button className="flex items-center gap-1 text-orange-500 text-xs font-bold uppercase tracking-wider hover:gap-2.5 transition-all duration-200">
                    Découvrir <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ PARTENAIRES ══════════════════════ */}
      <section id="partenaires" className="bg-slate-900 py-5 overflow-hidden">
        <div className="flex overflow-hidden">
          <div className="ticker flex items-center gap-16 whitespace-nowrap">
            {[...partners, ...partners].map((p, i) => (
              <span key={i} className="text-xs font-black uppercase tracking-[0.25em] cursor-default"
                style={{ color: i % 3 === 1 ? '#f97316' : 'rgba(255,255,255,0.2)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CONTACT ══════════════════════ */}
      <section id="contact" className="bg-slate-950 py-24 px-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-16 top-10 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
              <span className="text-sm font-black uppercase tracking-[0.32em] text-orange-400">Parlons-vous</span>
              <h2 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl">
                Besoin d’un coup de main ?
              </h2>
              <p className="mt-5 max-w-xl text-slate-300 leading-8">
                Notre équipe est à votre écoute pour toute demande commerciale, support technique ou partenariat. Nous répondons en moins de 24h.
              </p>
              <div className="mt-10 space-y-4">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">Téléphone</p>
                  <p className="mt-3 text-base font-semibold text-white">+237 600 000 000</p>
                  <p className="mt-1 text-sm text-slate-400">Disponible 7j/7 pour vos réservations.</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">Email</p>
                  <p className="mt-3 text-base font-semibold text-white">contact@afribus.cm</p>
                  <p className="mt-1 text-sm text-slate-400">Posez-nous vos questions ou envoyez vos documents.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.35)]">
              <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Envoyer un message</p>
                  <h3 className="mt-3 text-3xl font-black text-slate-900">Nous vous répondons vite.</h3>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
                  Rapide & simple
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleContactSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="text" placeholder="Nom complet" value={contactForm.name} onChange={(event) => handleContactChange('name', event.target.value)} required className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                  <input type="email" placeholder="Email" value={contactForm.email} onChange={(event) => handleContactChange('email', event.target.value)} required className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                </div>
                <input type="text" placeholder="Sujet" value={contactForm.subject} onChange={(event) => handleContactChange('subject', event.target.value)} required className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                <textarea rows={6} placeholder="Votre message…" value={contactForm.message} onChange={(event) => handleContactChange('message', event.target.value)} required className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none" />
                {contactStatus.message && (
                  <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                    contactStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {contactStatus.message}
                  </p>
                )}
                <button type="submit" disabled={contactSubmitting} className="flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                  {contactSubmitting ? 'Envoi en cours...' : 'Envoyer le message'} <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-8 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
            <Bus color="white" size={12} strokeWidth={2.5} />
          </div>
          <span className="text-white font-black text-sm">AFRIBUS</span>
        </div>
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.4em]">© MMXXVI — Tous droits réservés</p>
      </footer>

    </div>
  );
}

export default Home;
