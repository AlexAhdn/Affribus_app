<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Route;
use App\Models\Station;
use App\Models\Ticket;
use App\Models\CompanyNotification;
use App\Models\AdminNotification;
use App\Models\ReservationFeeTier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    private function ticketPayload(Ticket $ticket): array
    {
        $route = $ticket->route;
        $isUsed = (bool) $ticket->is_used || $ticket->validation_status === 'used';

        return [
            'id' => $ticket->id,
            'route_id' => $ticket->route_id,
            'route' => $route ? [
                'id' => $route->id,
                'departure_city' => $route->departure_city,
                'arrival_city' => $route->arrival_city,
                'departure_time' => $route->departure_time,
                'arrival_time' => $route->arrival_time,
                'price' => $route->price,
                'bus' => $route->bus,
            ] : null,
            'company' => $route?->company ? [
                'id' => $route->company->id,
                'name' => $route->company->name,
            ] : null,
            'payment' => $ticket->payment ? [
                'id' => $ticket->payment->id,
                'amount' => (float) $ticket->payment->amount,
                'status' => $ticket->payment->status,
                'transaction_id' => $ticket->payment->transaction_id,
                'method' => $ticket->payment->method,
            ] : null,
            'seats' => $ticket->seats ?? [],
            'passenger_names' => $ticket->passenger_names ?? [],
            'travel_date' => $ticket->travel_date?->toDateString(),
            'status' => $isUsed ? 'used' : $ticket->status,
            'payment_status' => $ticket->status,
            'transaction_id' => $ticket->transaction_id,
            'numero_unique' => $ticket->numero_unique,
            'amount' => (float) ($ticket->payment?->amount ?? $ticket->amount ?? 0),
            'boarding_station' => $ticket->boarding_station,
            'boarding_station_id' => $ticket->boarding_station_id,
            'boarding_station_details' => $ticket->boardingStation,
            'customer_name' => $ticket->customer_name,
            'customer_phone' => $ticket->customer_phone,
            'customer_email' => $ticket->customer_email,
            'validated_at' => $ticket->validated_at?->toIso8601String(),
            'validated_by' => $ticket->validated_by,
            'validation_status' => $ticket->validation_status ?? 'unused',
            'is_used' => (bool) $ticket->is_used,
        ];
    }

    private function resolveBoardingStation(Route $route, array $validated)
    {
        $stationsQuery = Station::query()
            ->where('company_id', $route->company_id)
            ->where('city', $route->departure_city);

        if (!empty($validated['boarding_station_id'])) {
            $station = (clone $stationsQuery)->find($validated['boarding_station_id']);

            if (!$station) {
                return response()->json([
                    'message' => "La station d'embarquement ne correspond pas a la ville de depart du trajet.",
                ], 422);
            }

            return $station;
        }

        if (!empty($validated['boarding_station'])) {
            $station = (clone $stationsQuery)
                ->where('name', $validated['boarding_station'])
                ->first();

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

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_id' => 'required|exists:routes,id',
            'customer_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'required|string|max:50',
            'seats' => 'required|array|min:1',
            'seats.*' => 'required|integer|min:1',
            'passenger_names' => 'nullable|array',
            'passenger_names.*.seat' => 'required_with:passenger_names|integer|min:1',
            'passenger_names.*.name' => 'required_with:passenger_names|string|max:255',
            'travel_date' => 'required|date',
            'transaction_id' => 'required|string|max:255|unique:tickets,transaction_id',
            'status' => ['nullable', Rule::in(['paid', 'pending', 'cancelled'])],
            'boarding_station' => 'nullable|string|max:255',
            'boarding_station_id' => 'nullable|integer|exists:stations,id',
        ]);

        $route = Route::find($validated['route_id']);
        $boardingStation = $this->resolveBoardingStation($route, $validated);

        if ($boardingStation instanceof \Illuminate\Http\JsonResponse) {
            return $boardingStation;
        }

        $selectedSeats = array_values(array_unique($validated['seats']));
        $passengerNames = $validated['passenger_names'] ?? [];

        if (!empty($passengerNames)) {
            $passengerSeats = collect($passengerNames)->pluck('seat')->map(fn ($seat) => (int) $seat)->sort()->values()->all();
            $expectedSeats = collect($selectedSeats)->map(fn ($seat) => (int) $seat)->sort()->values()->all();

            if ($passengerSeats !== $expectedSeats) {
                return response()->json([
                    'message' => 'Chaque siege selectionne doit avoir le nom de son passager.',
                ], 422);
            }

            $passengerNames = collect($passengerNames)
                ->map(fn ($passenger) => [
                    'seat' => (int) $passenger['seat'],
                    'name' => trim($passenger['name']),
                ])
                ->sortBy('seat')
                ->values()
                ->all();
        }

        $amount = (count($selectedSeats) * (float) ($route?->price ?? 0));
        $reservationFee = ReservationFeeTier::feeForPrice((float) ($route?->price ?? 0)) * count($selectedSeats);
        $paidAmount = $amount + $reservationFee;
        $authenticatedUser = $request->user('sanctum');
        $traveler = $authenticatedUser
            && $authenticatedUser->role === 'client'
            && $authenticatedUser->company_id === null
                ? $authenticatedUser
                : null;

        $ticket = Ticket::create([
            'user_id' => $traveler?->id,
            'route_id' => $validated['route_id'],
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'] ?? $validated['email'] ?? $traveler?->email,
            'customer_phone' => $validated['customer_phone'],
            'seats' => $selectedSeats,
            'passenger_names' => $passengerNames,
            'travel_date' => $validated['travel_date'],
            'transaction_id' => $validated['transaction_id'],
            'status' => $validated['status'] ?? 'paid',
            'boarding_station' => $boardingStation?->name ?? $validated['boarding_station'] ?? null,
            'boarding_station_id' => $boardingStation?->id,
            'amount' => $amount,
        ]);

        Payment::create([
            'ticket_id' => $ticket->id,
            'transaction_id' => $ticket->transaction_id,
            'amount' => $paidAmount,
            'commission_percent' => 0,
            'commission_amount' => $reservationFee,
            'method' => 'kkiapay',
            'status' => $ticket->status,
        ]);

        if ($route?->company_id && $ticket->status === 'paid') {
            $routeLabel = "{$route->departure_city} -> {$route->arrival_city}";
            $seats = implode(', ', $ticket->seats ?? []);

            CompanyNotification::create([
                'company_id' => $route->company_id,
                'ticket_id' => $ticket->id,
                'type' => 'reservation_created',
                'title' => 'Nouvelle reservation',
                'message' => "Une reservation a ete confirmee sur le trajet {$routeLabel} pour le {$ticket->travel_date?->format('d/m/Y')}."
                    . ($seats ? " Siege(s) : {$seats}." : ''),
                'route_label' => $routeLabel,
                'travel_date' => $ticket->travel_date,
            ]);

            AdminNotification::create([
                'type' => 'reservation_created',
                'title' => 'Nouvelle reservation',
                'message' => "Reservation confirmee chez {$route->company?->name} sur le trajet {$routeLabel}."
                    . ($seats ? " Siege(s) : {$seats}." : ''),
                'data' => [
                    'ticket_id' => $ticket->id,
                    'company_id' => $route->company_id,
                    'company_name' => $route->company?->name,
                    'route_id' => $route->id,
                    'route_label' => $routeLabel,
                    'travel_date' => $ticket->travel_date?->toDateString(),
                    'customer_name' => $ticket->customer_name,
                    'customer_email' => $ticket->customer_email,
                    'customer_phone' => $ticket->customer_phone,
                    'linked_user_id' => $ticket->user_id,
                    'seats' => $ticket->seats,
                    'passenger_names' => $ticket->passenger_names,
                    'amount' => $amount,
                    'reservation_fee' => $reservationFee,
                    'paid_amount' => $paidAmount,
                    'transaction_id' => $ticket->transaction_id,
                ],
            ]);
        }

        $ticket->load('route.company', 'user:id,name,email,phone', 'boardingStation:id,name,city,address');

        return response()->json([
            'message' => 'Billet enregistré avec succès.',
            'ticket' => $ticket,
        ], 201);
    }

    public function myTickets(Request $request)
    {
        $tickets = Ticket::query()
            ->with([
                'route.company:id,name',
                'route.bus:id,name,registration_number',
                'payment:id,ticket_id,amount,status,transaction_id',
                'boardingStation:id,name,city,address',
            ])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('travel_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Ticket $ticket) => $this->ticketPayload($ticket));

        return response()->json(['tickets' => $tickets]);
    }

    public function myTicket(Request $request, Ticket $ticket)
    {
        $ticket->load([
            'route.company:id,name',
            'route.bus:id,name,registration_number,seat_count',
            'payment:id,ticket_id,amount,status,transaction_id,method',
            'user:id,name,email,phone',
            'boardingStation:id,name,city,address',
        ]);

        if ((int) $ticket->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Billet introuvable.'], 404);
        }

        return response()->json(['ticket' => $this->ticketPayload($ticket)]);
    }

    public function validateCompanyTicket(Request $request)
    {
        $validated = $request->validate([
            'numero_unique' => 'nullable|string|max:255|required_without:transaction_id',
            'transaction_id' => 'nullable|string|max:255|required_without:numero_unique',
        ]);

        $identifier = trim($validated['transaction_id'] ?? $validated['numero_unique']);
        $ticket = Ticket::query()
            ->with(['route.company:id,name', 'payment:id,ticket_id,amount,status,transaction_id,method', 'user:id,name,email,phone', 'boardingStation:id,name,city,address'])
            ->where('transaction_id', $identifier)
            ->first();

        if (!$ticket && !empty($validated['numero_unique'])) {
            $ticket = Ticket::query()
                ->with(['route.company:id,name', 'payment:id,ticket_id,amount,status,transaction_id,method', 'user:id,name,email,phone', 'boardingStation:id,name,city,address'])
                ->get()
                ->first(fn (Ticket $candidate) => $candidate->numero_unique === $identifier);
        }

        if (!$ticket) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'Billet introuvable.',
            ], 404);
        }

        if ((int) $ticket->route?->company_id !== (int) $request->user()->company_id) {
            return response()->json([
                'status' => 'other_company',
                'message' => "Ce billet appartient a une autre compagnie.",
            ], 403);
        }

        if ($request->user()->role === 'company_reservation' && $request->user()->station_id) {
            $stationMatches = (int) $ticket->boarding_station_id === (int) $request->user()->station_id
                || ($ticket->boarding_station_id === null && $ticket->boarding_station === $request->user()->station?->name);

            if (!$stationMatches) {
                return response()->json([
                    'status' => 'other_station',
                    'message' => "Ce billet appartient a une autre station.",
                ], 403);
            }
        }

        $payload = $this->ticketPayload($ticket);
        $payload['client'] = $ticket->customer_name ?? $ticket->user?->name;
        $payload['phone'] = $ticket->customer_phone ?? $ticket->user?->phone;

        if ($ticket->status !== 'paid' || ($ticket->payment && $ticket->payment->status !== 'paid')) {
            return response()->json([
                'status' => 'not_paid',
                'message' => "Ce billet n'est pas paye.",
                'ticket' => $payload,
            ], 422);
        }

        if ($ticket->is_used || $ticket->validation_status === 'used') {
            return response()->json([
                'status' => 'already_used',
                'message' => 'Ce billet a deja ete utilise.',
                'ticket' => $payload,
            ], 409);
        }

        if (!$ticket->travel_date || !$ticket->travel_date->isSameDay(Carbon::today())) {
            return response()->json([
                'status' => 'wrong_date',
                'message' => "Ce billet n'est pas prevu pour aujourd'hui.",
                'ticket' => $payload,
            ], 422);
        }

        $ticket->forceFill([
            'validated_at' => now(),
            'validated_by' => $request->user()->id,
            'validation_status' => 'used',
            'is_used' => true,
        ])->save();

        $ticket->refresh()->load(['route.company:id,name', 'payment:id,ticket_id,amount,status,transaction_id,method', 'user:id,name,email,phone', 'boardingStation:id,name,city,address']);

        return response()->json([
            'status' => 'valid',
            'message' => 'Billet valide.',
            'ticket' => array_merge($this->ticketPayload($ticket), [
                'client' => $ticket->customer_name ?? $ticket->user?->name,
                'phone' => $ticket->customer_phone ?? $ticket->user?->phone,
            ]),
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
