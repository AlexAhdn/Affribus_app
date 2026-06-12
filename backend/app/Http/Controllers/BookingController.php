<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AdminNotification;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'route_id' => 'required|exists:routes,id',
            'travel_date' => 'required|date',
            'seats' => 'required|array|min:1',
            'seats.*' => 'integer',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email',
        ]);

        try {
            return DB::transaction(function () use ($request) {

                $routeId = $request->route_id;
                $date = $request->travel_date;
                $seats = $request->seats;

                // 🔒 1. Vérifier si sièges déjà réservés
                $existing = Booking::where('route_id', $routeId)
                    ->where('travel_date', $date)
                    ->whereIn('status', ['pending', 'paid'])
                    ->where(function ($query) use ($seats) {
                        foreach ($seats as $seat) {
                            $query->orWhereJsonContains('seats', $seat);
                        }
                    })
                    ->exists();

                if ($existing) {
                    return response()->json([
                        'message' => 'Un ou plusieurs sièges sont déjà réservés.'
                    ], 409);
                }

                // ⏳ 2. Créer réservation temporaire (10 min)
                $booking = Booking::create([
                    'user_id' => $request->user()?->id,
                    'route_id' => $routeId,
                    'travel_date' => $date,
                    'seats' => $seats,
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'email' => $request->email,
                    'status' => 'pending',
                    'expires_at' => Carbon::now()->addMinutes(10),
                ]);

                return response()->json($booking, 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ✅ Confirmer paiement
    public function confirm($id)
    {
        $booking = Booking::findOrFail($id);

        if ($booking->status !== 'pending') {
            return response()->json([
                'message' => 'Réservation déjà traitée.'
            ], 400);
        }

        // ⛔ vérifier expiration
        if ($booking->expires_at && $booking->expires_at < now()) {
            $booking->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Réservation expirée.'
            ], 410);
        }

        $booking->update(['status' => 'paid']);
        $booking->load('route.company');

        $route = $booking->route;
        if ($route) {
            $routeLabel = "{$route->departure_city} -> {$route->arrival_city}";
            $seats = implode(', ', $booking->seats ?? []);
            $customerName = trim("{$booking->first_name} {$booking->last_name}");

            AdminNotification::create([
                'type' => 'reservation_created',
                'title' => 'Nouvelle reservation',
                'message' => "Reservation confirmee chez {$route->company?->name} sur le trajet {$routeLabel}."
                    . ($seats ? " Siege(s) : {$seats}." : ''),
                'data' => [
                    'booking_id' => $booking->id,
                    'company_id' => $route->company_id,
                    'company_name' => $route->company?->name,
                    'route_id' => $route->id,
                    'route_label' => $routeLabel,
                    'travel_date' => $booking->travel_date?->toDateString(),
                    'customer_name' => $customerName,
                    'customer_email' => $booking->email,
                    'seats' => $booking->seats,
                ],
            ]);
        }

        return response()->json([
            'message' => 'Paiement confirmé',
            'booking' => $booking
        ]);
    }

    // ❌ Annuler réservation
    public function cancel($id)
    {
        $booking = Booking::findOrFail($id);

        $booking->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Réservation annulée'
        ]);
    }
}
