<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\BusController;
use App\Http\Controllers\StationController;
use App\Http\Controllers\RouteController;
use App\Http\Controllers\SeatController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CompanyBookingController;
use App\Http\Controllers\CompanyBusController;
use App\Http\Controllers\CompanyNotificationController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\ReservationFeeController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\CompanyAdminController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\ReservationFeeTierAdminController;
use App\Http\Controllers\Admin\RouteAdminController;
use App\Http\Controllers\Admin\BookingAdminController;
use App\Http\Controllers\Admin\PaymentAdminController;
use App\Http\Controllers\Admin\UserAdminController;
use App\Http\Controllers\Admin\StatsAdminController;
use App\Http\Controllers\AuthController;


Route::post('/bookings', [BookingController::class, 'store']);
Route::post('/bookings/{id}/confirm', [BookingController::class, 'confirm']);
Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

// Auth & user
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [UserController::class, 'me']);
});

// Companies
Route::get('/companies', [CompanyController::class, 'index']);
Route::get('/companies/{id}', [CompanyController::class, 'show']);
Route::post('/companies/register', [CompanyController::class, 'register']);

// Routes & stations
Route::get('/routes', [RouteController::class, 'index']); // filtrage par ville départ/arrivée
Route::get('/stations', [StationController::class, 'index']); // lister toutes les stations
Route::get('/stations/company/{company_id}', [StationController::class, 'stationsByCompany']);
Route::post('/stations', [StationController::class, 'store']);

// Buses & seats
Route::get('/buses', [BusController::class, 'index']);
Route::get('/buses/{id}/seats', [SeatController::class, 'seatsByBus']);

// Tickets
Route::post('/tickets', [TicketController::class, 'store']); // réserver un siège
Route::middleware('auth:sanctum')->get('/my-tickets', [TicketController::class, 'myTickets']); // tickets utilisateur
Route::middleware('auth:sanctum')->get('/my-tickets/{ticket}', [TicketController::class, 'myTicket']);

// Payments
Route::post('/payments', [PaymentController::class, 'store']); // enregistrer paiement

// Cities
Route::get('/cities', [CityController::class, 'index']);
Route::post('/contact-messages', [ContactMessageController::class, 'store']);
Route::get('/reservation-fees', [ReservationFeeController::class, 'index']);
Route::get('/reservation-fees/calculate', [ReservationFeeController::class, 'calculate']);


// recherche de companies
Route::get('/routes/search', [RouteController::class, 'search']);


Route::get('/routes/{id}/seats', [RouteController::class, 'seats']);

Route::middleware(['auth:sanctum', 'isAdmin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/companies', [CompanyAdminController::class, 'index']);
    Route::post('/companies', [CompanyAdminController::class, 'store']);
    Route::put('/companies/{id}', [CompanyAdminController::class, 'update']);
    Route::delete('/companies/{id}', [CompanyAdminController::class, 'destroy']);
    Route::patch('/companies/{id}/approve', [CompanyAdminController::class, 'approve']);
    Route::patch('/companies/{id}/toggle-status', [CompanyAdminController::class, 'toggleStatus']);

    Route::get('/routes', [RouteAdminController::class, 'index']);
    Route::delete('/routes/{id}', [RouteAdminController::class, 'destroy']);

    Route::get('/bookings', [BookingAdminController::class, 'index']);
    Route::get('/payments', [PaymentAdminController::class, 'index']);
    Route::get('/notifications', [AdminNotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [AdminNotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [AdminNotificationController::class, 'markAllAsRead']);
    Route::get('/reservation-fee-tiers', [ReservationFeeTierAdminController::class, 'index']);
    Route::put('/reservation-fee-tiers/{tier}', [ReservationFeeTierAdminController::class, 'update']);

    Route::get('/users', [UserAdminController::class, 'index']);
    Route::patch('/users/{id}/toggle-block', [UserAdminController::class, 'toggleBlock']);
    Route::get('/users/{id}/bookings', [UserAdminController::class, 'bookings']);

    Route::get('/stats/sales-per-day', [StatsAdminController::class, 'salesPerDay']);
    Route::get('/stats/top-routes', [StatsAdminController::class, 'topRoutes']);
    Route::get('/stats/top-companies', [StatsAdminController::class, 'topCompanies']);
});

// Test temporaire sans middleware
Route::get('/admin/companies-test', [CompanyAdminController::class, 'index']);



// Route publique pour la connexion
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées (nécessitent un token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    // ... tes autres routes protégées ici
});




Route::middleware('auth:sanctum')->group(function () {

    // --- ROUTES COMPAGNIE (Le nouveau Dashboard) ---
    Route::middleware('can:is-company')->prefix('company')->group(function () {
        // La compagnie récupère ses propres infos
        Route::middleware('can:is-company-admin')->group(function () {
            Route::get('/profile', [CompanyController::class, 'myCompanyProfile']);
            Route::patch('/profile', [CompanyController::class, 'updateMyCompanyProfile']);
            Route::get('/stats', [CompanyController::class, 'myStats']);
            Route::get('/wallet', [CompanyController::class, 'myWallet']);
            Route::post('/support-message', [ContactMessageController::class, 'storeCompanySupport']);
            Route::get('/reservation-users', [CompanyController::class, 'reservationUsers']);
            Route::post('/reservation-users', [CompanyController::class, 'storeReservationUser']);

            Route::get('/buses', [CompanyBusController::class, 'index']);
            Route::post('/buses', [CompanyBusController::class, 'store']);
            Route::delete('/buses/{id}', [CompanyBusController::class, 'destroy']);

            Route::post('/routes', [RouteController::class, 'store']);
            Route::delete('/routes/{id}', [RouteController::class, 'destroy']);

            Route::get('/notifications', [CompanyNotificationController::class, 'index']);
            Route::patch('/notifications/{id}/read', [CompanyNotificationController::class, 'markAsRead']);
            Route::patch('/notifications/read-all', [CompanyNotificationController::class, 'markAllAsRead']);
        });

        Route::middleware('can:is-company-reservation')->group(function () {
            Route::get('/routes', [RouteController::class, 'companyRoutes']);

            Route::get('/bookings', [CompanyBookingController::class, 'index']);
            Route::post('/manual-reservation', [CompanyBookingController::class, 'manualReservation']);
            Route::post('/tickets/validate', [TicketController::class, 'validateCompanyTicket']);
        });
    });
});
