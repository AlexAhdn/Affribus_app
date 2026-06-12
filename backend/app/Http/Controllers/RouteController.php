<?php

namespace App\Http\Controllers;

use App\Models\Buses;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Route;
use App\Models\Ticket;
use Illuminate\Support\Facades\Schema;

class RouteController extends Controller
{
    public function index()
    {
        return Route::query()
            ->with(['company:id,name', 'bus:id,name,registration_number'])
            ->orderByDesc('id')
            ->get();
    }

    public function search(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        return Route::query()
            ->with(['company:id,name', 'bus:id,name,registration_number'])
            ->when($from, fn ($query) => $query->where('departure_city', $from))
            ->when($to, fn ($query) => $query->where('arrival_city', $to))
            ->orderBy('departure_time')
            ->get();
    }

    // Méthode pour générer les sièges
    public function seats(Request $request, $id)
    {
        $route = Route::find($id);

        if (!$route) {
            return response()->json(['message' => 'Trajet non trouvé'], 404);
        }

        $travelDate = $request->query('date');
        $bookedSeatNumbers = [];

        if ($travelDate) {
            $ticketSeats = [];
            $ticketColumnsAreReady = Schema::hasColumns('tickets', ['route_id', 'travel_date', 'status', 'seats']);
            if ($ticketColumnsAreReady) {
                $ticketSeats = Ticket::where('route_id', $id)
                    ->whereDate('travel_date', $travelDate)
                    ->where('status', 'paid')
                    ->pluck('seats')
                    ->toArray();
            }

            $pendingBookingSeats = Booking::where('route_id', $id)
                ->whereDate('travel_date', $travelDate)
                ->whereIn('status', ['pending', 'paid'])
                ->where(function ($query) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->pluck('seats')
                ->toArray();

            $bookedSeatNumbers = collect(array_merge($ticketSeats, $pendingBookingSeats))
                ->flatten()
                ->map(fn ($seat) => (int) $seat)
                ->unique()
                ->values()
                ->all();
        }

        $seats = [];
        for ($i = 1; $i <= $route->available_seats; $i++) {
            $seats[] = [
                'number' => $i,
                'available' => !in_array($i, $bookedSeatNumbers, true),
            ];
        }

        return response()->json([
            'route_id' => $route->id,
            'departure_city' => $route->departure_city,
            'arrival_city' => $route->arrival_city,
            'departure_time' => $route->departure_time,
            'arrival_time' => $route->arrival_time,
            'seats' => $seats,
            'price' => $route->price,
            'company' => $route->company,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bus_id' => 'required|integer|exists:buses,id',
            'departure_city' => 'required|string|max:255',
            'arrival_city' => 'required|string|max:255|different:departure_city',
            'departure_time' => 'required',
            'arrival_time' => 'nullable',
            'price' => 'required|numeric|min:0',
        ]);

        $companyId = $request->user()->company_id;
        $bus = Buses::query()
            ->withCount('seats')
            ->where('company_id', $companyId)
            ->findOrFail($validated['bus_id']);

        $route = Route::create([
            ...$validated,
            'company_id' => $companyId,
            'available_seats' => $bus->seats_count ?: $bus->seat_count,
        ]);

        return response()->json(
            $route->load(['company:id,name', 'bus:id,name,registration_number']),
            201
        );
    }

    public function companyRoutes(Request $request)
    {
        return Route::query()
            ->with(['company:id,name', 'bus:id,name,registration_number'])
            ->where('company_id', $request->user()->company_id)
            ->when(
                $request->user()->role === 'company_reservation' && $request->user()->station,
                fn ($query) => $query->where('departure_city', $request->user()->station->city)
            )
            ->orderByDesc('id')
            ->get();
    }

    public function show(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(Request $request, string $id)
    {
        $route = Route::query()
            ->where('company_id', $request->user()->company_id)
            ->findOrFail($id);

        $route->delete();

        return response()->json(['message' => 'Trajet supprime avec succes.']);
    }
}
