<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Models\CompanyNotification;
use App\Models\Route;
use App\Models\Station;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CompanyBookingController extends Controller
{
    private function normalizeSeats($seats): array
    {
        if (is_array($seats)) {
            return $seats;
        }

        if (is_string($seats)) {
            $decodedSeats = json_decode($seats, true);

            if (is_array($decodedSeats)) {
                return $decodedSeats;
            }

            return array_values(array_filter(array_map('trim', explode(',', $seats))));
        }

        return [];
    }

    private function resolveBoardingStation(Request $request, Route $route, array $validated)
    {
        $user = $request->user();
        $stationsQuery = Station::query()
            ->where('company_id', $route->company_id)
            ->where('city', $route->departure_city);

        if ($user->role === 'company_reservation') {
            $station = (clone $stationsQuery)->find($user->station_id);

            if (!$station) {
                return response()->json([
                    'message' => "Votre sous-compte n'est pas rattache a une station de depart de ce trajet.",
                ], 403);
            }

            return $station;
        }

        if (!empty($validated['boarding_station_id'])) {
            $station = (clone $stationsQuery)->find($validated['boarding_station_id']);

            if (!$station) {
                return response()->json([
                    'message' => "La station d'embarquement ne correspond pas a la ville de depart du trajet.",
                ], 422);
            }

            return $station;
        }

        $stations = $stationsQuery->get();

        if ($stations->count() === 1) {
            return $stations->first();
        }

        if ($stations->count() > 1) {
            return response()->json([
                'message' => "Veuillez choisir une station d'embarquement.",
            ], 422);
        }

        return null;
    }

    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $bookings = Ticket::query()
            ->with(['route.company:id,name', 'route.bus:id,name,registration_number', 'user:id,name,email,phone', 'boardingStation:id,name,city,address'])
            ->whereNotNull('travel_date')
            ->whereHas('route', fn ($query) => $query->where('company_id', $companyId));

        if ($request->user()->role === 'company_reservation') {
            $bookings->where('boarding_station_id', $request->user()->station_id);
        }

        if ($request->filled('route_id')) {
            $bookings->where('route_id', $request->route_id);
        }

        $period = $request->query('period', 'today');
        if ($period !== 'all') {
            $now = Carbon::now();
            $dateFrom = null;
            $dateTo = $now->copy()->endOfDay();

            switch ($period) {
                case 'today':
                    $dateFrom = $now->copy()->startOfDay();
                    break;
                case 'thisWeek':
                    $dateFrom = $now->copy()->startOfDay();
                    $dateTo = $now->copy()->endOfWeek();
                    break;
                case 'thisMonth':
                    $dateFrom = $now->copy()->startOfDay();
                    $dateTo = $now->copy()->endOfMonth();
                    break;
                default:
                    $dateFrom = $now->copy()->startOfDay();
                    $dateTo = $now->copy()->endOfMonth();
            }

            $bookings->whereBetween('travel_date', [
                $dateFrom->toDateString(),
                $dateTo->toDateString(),
            ]);
        }

        $bookings = $bookings
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 10));

        $bookings->getCollection()->transform(function ($booking) {
            $seatCount = count($this->normalizeSeats($booking->seats));
            $price = (float) ($booking->route?->price ?? 0);
            $booking->amount = round($seatCount * $price, 2);
            $booking->seat_count = $seatCount;
            $booking->client = $booking->customer_name ?? '-';
            $booking->linked_traveler = $booking->user ? [
                'id' => $booking->user->id,
                'name' => $booking->user->name,
                'email' => $booking->user->email,
                'phone' => $booking->user->phone,
            ] : null;
            return $booking;
        });

        return response()->json($bookings);
    }

    public function manualReservation(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'route_id' => 'required|integer|exists:routes,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'travel_date' => 'required|date',
            'seats' => 'required|array|min:1',
            'seats.*' => 'integer|min:1',
            'boarding_station_id' => 'nullable|integer|exists:stations,id',
        ]);

        $route = Route::findOrFail($validated['route_id']);
        if ($route->company_id !== $companyId) {
            return response()->json(['message' => 'Non autorise'], 403);
        }

        $boardingStation = $this->resolveBoardingStation($request, $route, $validated);

        if ($boardingStation instanceof \Illuminate\Http\JsonResponse) {
            return $boardingStation;
        }

        $existingSeats = Ticket::where('route_id', $validated['route_id'])
            ->whereDate('travel_date', $validated['travel_date'])
            ->where('status', 'paid')
            ->get()
            ->map(fn ($ticket) => $ticket->seats)
            ->flatten()
            ->map(fn ($seat) => (int) $seat)
            ->unique()
            ->all();

        $conflictingSeats = array_intersect($validated['seats'], $existingSeats);
        if (!empty($conflictingSeats)) {
            return response()->json(
                ['message' => 'Les sieges ' . implode(', ', $conflictingSeats) . ' sont deja reserves'],
                422
            );
        }

        $ticket = Ticket::create([
            'route_id' => $validated['route_id'],
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'] ?? null,
            'travel_date' => $validated['travel_date'],
            'seats' => $validated['seats'],
            'status' => 'paid',
            'transaction_id' => 'MANUAL-' . time() . '-' . rand(1000, 9999),
            'amount' => count($validated['seats']) * $route->price,
            'boarding_station' => $boardingStation?->name,
            'boarding_station_id' => $boardingStation?->id,
        ]);

        $ticket->load([
            'boardingStation:id,name,city,address',
            'route' => function ($query) {
                $query->with(['company:id,name', 'bus:id,name,seat_count,registration_number']);
            },
        ]);

        $routeLabel = "{$route->departure_city} -> {$route->arrival_city}";
        $seats = implode(', ', $ticket->seats ?? []);

        CompanyNotification::create([
            'company_id' => $companyId,
            'ticket_id' => $ticket->id,
            'type' => 'reservation_created',
            'title' => 'Nouvelle reservation',
            'message' => "Une reservation manuelle a ete creee sur le trajet {$routeLabel} pour le {$ticket->travel_date?->format('d/m/Y')}."
                . ($seats ? " Siege(s) : {$seats}." : ''),
            'route_label' => $routeLabel,
            'travel_date' => $ticket->travel_date,
        ]);

        AdminNotification::create([
            'type' => 'reservation_created',
            'title' => 'Nouvelle reservation',
            'message' => "Reservation manuelle creee chez {$route->company?->name} sur le trajet {$routeLabel}."
                . ($seats ? " Siege(s) : {$seats}." : ''),
            'data' => [
                'ticket_id' => $ticket->id,
                'company_id' => $companyId,
                'company_name' => $route->company?->name,
                'route_id' => $route->id,
                'route_label' => $routeLabel,
                'travel_date' => $ticket->travel_date?->toDateString(),
                'customer_name' => $ticket->customer_name,
                'customer_phone' => $ticket->customer_phone,
                'seats' => $ticket->seats,
                'amount' => $ticket->amount,
                'boarding_station_id' => $ticket->boarding_station_id,
                'boarding_station' => $ticket->boarding_station,
                'transaction_id' => $ticket->transaction_id,
            ],
        ]);

        return response()->json([
            'message' => 'Reservation creee avec succes',
            'ticket' => $ticket,
        ], 201);
    }
}
