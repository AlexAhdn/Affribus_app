<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = Company::query()->where('status', 'active');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->withCount('routes')
                ->orderBy('name')
                ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:companies,email|unique:users,email',
            'phone' => 'required|string|min:8',
        ]);

        DB::transaction(function () use ($request) {
            $company = Company::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'status' => 'active',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->phone,
                'phone' => $request->phone,
                'role' => 'admin',
                'company_id' => $company->id,
                'is_blocked' => false,
            ]);

            $company->update([
                'user_id' => $user->id,
            ]);
        });

        return response()->json(['message' => 'Compagnie et acces crees !'], 201);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:companies,email|unique:users,email',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|min:8|max:30',
            'password' => 'required|string|min:6|confirmed',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('companies/logos', 'public');
        }

        $result = DB::transaction(function () use ($validated, $logoPath) {
            $company = Company::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'logo' => $logoPath ? Storage::url($logoPath) : null,
                'status' => 'pending',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'],
                'role' => 'admin',
                'company_id' => $company->id,
                'is_blocked' => true,
            ]);

            $company->update([
                'user_id' => $user->id,
            ]);

            return [
                'company' => $company,
                'user' => $user,
            ];
        });

        return response()->json([
            'message' => 'Compagnie inscrite avec succes. Votre compte est en attente de validation par le superadmin.',
            'company' => $result['company'],
            'user' => $result['user'],
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $company = Company::findOrFail($id);
        $user = User::where('company_id', $company->id)->first();

        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:companies,email,' . $company->id . '|unique:users,email,' . ($user?->id ?? 'NULL'),
            'phone' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($request, $company, $user) {
                $company->update($request->only(['name', 'email', 'phone', 'status']));

                if ($user) {
                    $user->update([
                        'name' => $request->name ?? $company->name,
                        'email' => $request->email ?? $company->email,
                        'phone' => $request->phone ?? $company->phone,
                        'password' => $request->phone ?? $user->password,
                    ]);
                }
            });

            return response()->json(['message' => 'Compagnie et acces mis a jour']);
        } catch (\Exception $exception) {
            return response()->json(['message' => 'Erreur lors de la mise a jour'], 500);
        }
    }

    public function myCompanyProfile(Request $request)
    {
        return response()->json(
            $request->user()
                ->load('company')
                ->company
        );
    }

    public function updateMyCompanyProfile(Request $request)
    {
        $user = $request->user()->load('company');
        $company = $user->company;

        if (!$company) {
            return response()->json(['message' => 'Aucune compagnie liee a cet utilisateur.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:companies,email,' . $company->id . '|unique:users,email,' . $user->id,
            'phone' => 'required|string|min:8|max:30',
            'address' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $company, $user) {
            $company->update($validated);

            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
            ]);
        });

        return response()->json($company->fresh());
    }

    public function reservationUsers(Request $request)
    {
        return response()->json(
            User::query()
                ->with('station:id,name,city,address')
                ->where('company_id', $request->user()->company_id)
                ->where('role', 'company_reservation')
                ->orderByDesc('id')
                ->get(['id', 'name', 'email', 'phone', 'role', 'station_id', 'created_at'])
        );
    }

    public function storeReservationUser(Request $request)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'Aucune compagnie liee a cet utilisateur.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email|unique:companies,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:6',
            'station_id' => [
                'required',
                'integer',
                Rule::exists('stations', 'id')->where('company_id', $company->id),
            ],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'company_reservation',
            'company_id' => $company->id,
            'station_id' => $validated['station_id'],
            'is_blocked' => false,
        ]);

        return response()->json([
            'message' => 'Sous-compte reservation cree avec succes.',
            'user' => [
                ...$user->only(['id', 'name', 'email', 'phone', 'role', 'station_id', 'created_at']),
                'station' => $user->load('station:id,name,city,address')->station,
            ],
        ], 201);
    }

    public function myStats(Request $request)
    {
        $user = $request->user()->load('company');
        $company = $user->company;

        if (!$company) {
            return response()->json(['message' => 'Aucune compagnie liee a cet utilisateur.'], 404);
        }

        $period = $request->query('period', 'today');
        $routeIds = $company->routes()->pluck('id');

        // Déterminer les dates en fonction de la période
        $now = Carbon::now();
        $dateFrom = null;
        $dateTo = $now->copy()->endOfDay();

        switch($period) {
            case 'today':
                $dateFrom = $now->copy()->startOfDay();
                break;
            case 'thisWeek':
                $dateFrom = $now->copy()->startOfWeek();
                $dateTo = $now->copy()->endOfWeek();
                break;
            case 'thisMonth':
                $dateFrom = $now->copy()->startOfMonth();
                $dateTo = $now->copy()->endOfMonth();
                break;
            case 'thisYear':
                $dateFrom = $now->copy()->startOfYear();
                $dateTo = $now->copy()->endOfYear();
                break;
            default:
                $dateFrom = $now->copy()->startOfMonth();
                $dateTo = $now->copy()->endOfMonth();
        }

        $paidTickets = Ticket::query()
            ->with(['payment:id,ticket_id,amount', 'route:id,company_id,price'])
            ->whereIn('route_id', $routeIds)
            ->where('status', 'paid')
            ->whereBetween('travel_date', [$dateFrom->format('Y-m-d'), $dateTo->format('Y-m-d')])
            ->get(['id', 'route_id', 'seats', 'amount']);

        $calculateTicketAmount = function ($ticket) {
            $seats = $ticket->seats;
            if (is_string($seats)) {
                $decodedSeats = json_decode($seats, true);
                $seats = is_array($decodedSeats) ? $decodedSeats : [];
            }

            $seatCount = is_array($seats) ? count($seats) : 0;
            $routeAmount = $seatCount * (float) ($ticket->route?->price ?? 0);

            return (float) ($ticket->amount ?: $ticket->payment?->amount ?: $routeAmount);
        };

        $grossSales = $paidTickets->sum($calculateTicketAmount);

        // Récupération des données pour le graphique en fonction de la période sélectionnée
        $chartData = [];

        if ($period === 'today' || $period === 'thisWeek') {
            $chartDateFrom = $now->copy()->startOfWeek();
            $chartDateTo = $now->copy()->endOfWeek();

            $rawChartTickets = Ticket::query()
                ->with(['payment:id,ticket_id,amount', 'route:id,company_id,price'])
                ->whereIn('route_id', $routeIds)
                ->where('status', 'paid')
                ->whereBetween('travel_date', [$chartDateFrom->format('Y-m-d'), $chartDateTo->format('Y-m-d')])
                ->get(['id', 'route_id', 'seats', 'amount', 'travel_date']);

            $daysMap = [
                1 => 'Lundi',
                2 => 'Mardi',
                3 => 'Mercredi',
                4 => 'Jeudi',
                5 => 'Vendredi',
                6 => 'Samedi',
                7 => 'Dimanche',
            ];

            $startOfWeek = $now->copy()->startOfWeek();
            $tempChart = [];
            $daysDates = [];
            for ($i = 0; $i < 7; $i++) {
                $dayDate = $startOfWeek->copy()->addDays($i);
                $dayName = $daysMap[$dayDate->dayOfWeekIso];
                $tempChart[$dayName] = 0;
                $daysDates[$dayName] = $dayDate->format('d/m');
            }

            foreach ($rawChartTickets as $ticket) {
                $tDate = Carbon::parse($ticket->travel_date);
                $dayOfWeek = $tDate->dayOfWeekIso;
                $dayName = $daysMap[$dayOfWeek] ?? 'Lundi';
                $tempChart[$dayName] += $calculateTicketAmount($ticket);
            }

            foreach ($tempChart as $label => $value) {
                $dayDateStr = $daysDates[$label];
                $isTodayDate = ($dayDateStr === $now->format('d/m'));

                $chartData[] = [
                    'label' => $label,
                    'date' => $dayDateStr,
                    'value' => round($value, 2),
                    'isToday' => $isTodayDate,
                ];
            }
        } elseif ($period === 'thisMonth') {
            // Démarrer à partir du mois de première connexion (inscription de la compagnie)
            $chartDateFrom = $now->copy()->startOfYear();
            $chartDateTo = $now->copy()->endOfYear();

            $rawChartTickets = Ticket::query()
                ->with(['payment:id,ticket_id,amount', 'route:id,company_id,price'])
                ->whereIn('route_id', $routeIds)
                ->where('status', 'paid')
                ->whereBetween('travel_date', [$chartDateFrom->format('Y-m-d'), $chartDateTo->format('Y-m-d')])
                ->get(['id', 'route_id', 'seats', 'amount', 'travel_date']);

            $monthsMap = [
                1 => 'Janvier',
                2 => 'Février',
                3 => 'Mars',
                4 => 'Avril',
                5 => 'Mai',
                6 => 'Juin',
                7 => 'Juillet',
                8 => 'Août',
                9 => 'Septembre',
                10 => 'Octobre',
                11 => 'Novembre',
                12 => 'Décembre',
            ];

            $tempChart = [];
            for ($month = 1; $month <= 12; $month++) {
                $label = $monthsMap[$month];
                $tempChart[$label] = [
                    'value' => 0,
                    'month_num' => $month,
                    'year' => $now->year,
                ];
            }

            foreach ($rawChartTickets as $ticket) {
                $tDate = Carbon::parse($ticket->travel_date);
                foreach ($tempChart as $label => &$data) {
                    if ($tDate->month === $data['month_num'] && $tDate->year === $data['year']) {
                        $data['value'] += $calculateTicketAmount($ticket);
                        break;
                    }
                }
                unset($data);
            }

            foreach ($tempChart as $label => $data) {
                $chartData[] = [
                    'label' => $label,
                    'value' => round($data['value'], 2),
                ];
            }
        } else {
            // thisYear -> afficher par année à partir de l'année d'inscription
            $chartDateFrom = $now->copy()->startOfYear();
            $chartDateTo = $now->copy()->endOfYear();

            $rawChartTickets = Ticket::query()
                ->with(['payment:id,ticket_id,amount', 'route:id,company_id,price'])
                ->whereIn('route_id', $routeIds)
                ->where('status', 'paid')
                ->whereBetween('travel_date', [$chartDateFrom->format('Y-m-d'), $chartDateTo->format('Y-m-d')])
                ->get(['id', 'route_id', 'seats', 'amount', 'travel_date']);

            $tempChart = [];
            $tempChart[$now->year] = 0;

            foreach ($rawChartTickets as $ticket) {
                $tDate = Carbon::parse($ticket->travel_date);
                $tYear = $tDate->year;
                if (isset($tempChart[$tYear])) {
                    $tempChart[$tYear] += $calculateTicketAmount($ticket);
                }
            }

            foreach ($tempChart as $label => $value) {
                $chartData[] = [
                    'label' => (string) $label,
                    'value' => round($value, 2),
                ];
            }
        }

        return response()->json([
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'phone' => $company->phone,
                'status' => $company->status,
                'created_at' => $company->created_at,
            ],
            'totalRoutes' => $company->routes()->count(),
            'totalTickets' => $paidTickets->count(),
            'totalReservedSeats' => $paidTickets->sum(function ($ticket) {
                $seats = $ticket->seats;
                if (is_string($seats)) {
                    $decodedSeats = json_decode($seats, true);
                    $seats = is_array($decodedSeats) ? $decodedSeats : [];
                }

                return is_array($seats) ? count($seats) : 0;
            }),
            'grossSales' => round($grossSales, 2),
            'totalBuses' => $company->buses()->count(),
            'chartData' => $chartData,
        ]);
    }

    public function myWallet(Request $request)
    {
        $user = $request->user()->load('company');
        $company = $user->company;

        if (!$company) {
            return response()->json(['message' => 'Aucune compagnie liee a cet utilisateur.'], 404);
        }

        $tickets = Ticket::query()
            ->with([
                'payment:id,ticket_id,amount,method',
                'route:id,company_id,bus_id,departure_city,arrival_city,departure_time,price',
                'route.bus:id,name,registration_number',
            ])
            ->where('status', 'paid')
            ->whereHas('route', fn ($query) => $query->where('company_id', $company->id))
            ->orderByDesc('id')
            ->get();

        $transactions = $tickets->map(function ($ticket) {
            $seats = $ticket->seats;
            if (is_string($seats)) {
                $decodedSeats = json_decode($seats, true);
                $seats = is_array($decodedSeats) ? $decodedSeats : [];
            }

            $seatCount = is_array($seats) ? count($seats) : 0;
            $routeAmount = $seatCount * (float) ($ticket->route?->price ?? 0);
            $amount = (float) ($ticket->amount ?: $ticket->payment?->amount ?: $routeAmount);
            $transactionId = (string) ($ticket->transaction_id ?? '');

            return [
                'id' => $ticket->id,
                'transaction_id' => $ticket->transaction_id,
                'customer_name' => $ticket->customer_name,
                'customer_phone' => $ticket->customer_phone,
                'travel_date' => $ticket->travel_date,
                'seats' => $seats,
                'seat_count' => $seatCount,
                'amount' => round($amount, 2),
                'reservation_method' => str_starts_with($transactionId, 'MANUAL-') ? 'manual' : 'online',
                'route' => $ticket->route,
                'created_at' => $ticket->created_at,
            ];
        });

        return response()->json([
            'balance' => round($transactions->sum('amount'), 2),
            'total_transactions' => $transactions->count(),
            'manual_total' => round($transactions->where('reservation_method', 'manual')->sum('amount'), 2),
            'online_total' => round($transactions->where('reservation_method', 'online')->sum('amount'), 2),
            'manual_count' => $transactions->where('reservation_method', 'manual')->count(),
            'online_count' => $transactions->where('reservation_method', 'online')->count(),
            'transactions' => $transactions->values(),
        ]);
    }

    public function destroy(string $id)
    {
        try {
            DB::transaction(function () use ($id) {
                $company = Company::findOrFail($id);
                User::where('company_id', $company->id)->delete();
                $company->delete();
            });

            return response()->json(['message' => 'Compagnie et compte utilisateur supprimes']);
        } catch (\Exception $exception) {
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}
