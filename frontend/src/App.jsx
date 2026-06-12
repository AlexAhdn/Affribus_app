import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/client/Home.jsx'
import Companies from './pages/client/Companies.jsx'
import Booking from './pages/client/Booking.jsx'
import Stations from './pages/client/Stations.jsx'
import Seats from './pages/client/Seats.jsx'
import Payment from './pages/client/Payment.jsx'
import Signup from './pages/client/Signup.jsx'
import ClientLogin from './pages/client/elog.jsx'
import CompanySignup from './pages/client/CompanySignup.jsx'
import MyTickets from './pages/client/MyTickets.jsx'
import Voyageur from './pages/client/Voyageur.jsx'
import TicketDetail from './pages/client/TicketDetail.jsx'
import Checkout from './pages/client/Checkout.jsx';
import Success from './pages/client/Succes.jsx';
import StationsAdmin from './pages/client/StationsAdmin.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminCompanies from './pages/admin/Companies.jsx'
import AdminBookings from './pages/admin/Bookings.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import AdminPayments from './pages/admin/Payments.jsx'
import AdminNotifications from './pages/admin/Notifications.jsx'
import AdminTarification from './pages/admin/Tarification.jsx'
import AdminSeats from './pages/admin/Seats'; // Vérifie bien le chemin
import Trajets from './pages/admin/Trajets';
import Login from './pages/admin/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute'; // Vérifie bien le chemin du fichier
import CompanyDashboard from './pages/admin/company/CompanyDashboard';
import CompanyRoutes from './pages/admin/company/CompanyRoutes';
import CompanyBuses from './pages/admin/company/CompanyBuses';
import CompanyBookings from './pages/admin/company/CompanyBookings';
import CompanyTicketSuccess from './pages/admin/company/CompanyTicketSuccess';
import CompanyReservationDetails from './pages/admin/company/CompanyReservationDetails';
import CompanyWallet from './pages/admin/company/CompanyWallet';
import CompanyNotifications from './pages/admin/company/CompanyNotifications';
import CompanySettings from './pages/admin/company/CompanySettings';
import CompanyTicketValidation from './pages/admin/company/CompanyTicketValidation';



import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/companies/:from/:to" element={<Companies />} />
          <Route path="/booking/:routeId" element={<Booking />} />
          <Route path="/stations/:companyId" element={<Stations />} />
          <Route path="/seats/:tripId" element={<Seats />} />
          <Route path="/elogin" element={<Login />} />
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/inscription" element={<Signup />} />
          <Route path="/inscription-compagnie" element={<CompanySignup />} />
          <Route path="/mes-tickets" element={<MyTickets />} />
          <Route path="/voyageur" element={
            <ProtectedRoute roleRequired="client">
              <Voyageur />
            </ProtectedRoute>
          } />
          <Route path="/voyageur/billets/:ticketId" element={
            <ProtectedRoute roleRequired="client">
              <TicketDetail />
            </ProtectedRoute>
          } />
          <Route path="/checkout/:routeId" element={<Checkout />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/success" element={<Success />} />
          <Route path="/admin/stations" element={<StationsAdmin />} />

          {/* 2. Route super admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roleRequired="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/companies" element={
            <ProtectedRoute roleRequired="admin">
              <AdminCompanies />
            </ProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <ProtectedRoute roleRequired="admin">
              <AdminBookings />
            </ProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <ProtectedRoute roleRequired="admin">
              <AdminPayments />
            </ProtectedRoute>
          } />
          <Route path="/admin/tarification" element={
            <ProtectedRoute roleRequired="admin">
              <AdminTarification />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute roleRequired="admin">
              <AdminNotifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roleRequired="admin">
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/seats" element={
            <ProtectedRoute roleRequired="admin">
              <AdminSeats />
            </ProtectedRoute>
          } />
          <Route path="/admin/trajets" element={
            <ProtectedRoute roleRequired="admin">
              <Trajets />
            </ProtectedRoute>
          } />
          <Route path="/admin/login" element={<Login />} />

          <Route path="/company/dashboard" element={
            <ProtectedRoute roleRequired="company">
              <CompanyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/company/routes" element={
            <ProtectedRoute roleRequired="company">
              <CompanyRoutes />
            </ProtectedRoute>
          } />
          <Route path="/company/trajets" element={
            <ProtectedRoute roleRequired="company">
              <CompanyRoutes />
            </ProtectedRoute>
          } />
          <Route path="/company/buses" element={
            <ProtectedRoute roleRequired="company">
              <CompanyBuses />
            </ProtectedRoute>
          } />
          <Route path="/company/bookings" element={
            <ProtectedRoute roleRequired="companyReservation">
              <CompanyBookings />
            </ProtectedRoute>
          } />
          <Route path="/company/ticket-success" element={
            <ProtectedRoute roleRequired="companyReservation">
              <CompanyTicketSuccess />
            </ProtectedRoute>
          } />
          <Route path="/company/reservations" element={
            <ProtectedRoute roleRequired="companyReservation">
              <CompanyBookings />
            </ProtectedRoute>
          } />
          <Route path="/company/reservations/:routeId" element={
            <ProtectedRoute roleRequired="companyReservation">
              <CompanyReservationDetails />
            </ProtectedRoute>
          } />
          <Route path="/company/validation-billet" element={
            <ProtectedRoute roleRequired="companyReservation">
              <CompanyTicketValidation />
            </ProtectedRoute>
          } />
          <Route path="/company/wallet" element={
            <ProtectedRoute roleRequired="company">
              <CompanyWallet />
            </ProtectedRoute>
          } />
          <Route path="/company/notifications" element={
            <ProtectedRoute roleRequired="company">
              <CompanyNotifications />
            </ProtectedRoute>
          } />
          <Route path="/company/parametre" element={
            <ProtectedRoute roleRequired="company">
              <CompanySettings />
            </ProtectedRoute>
          } />


        </Routes>
      </div>
    </Router>
  )
}

export default App
