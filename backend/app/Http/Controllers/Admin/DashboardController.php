<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Route;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $grossSales = (float) Ticket::query()
            ->join('routes', 'routes.id', '=', 'tickets.route_id')
            ->where('tickets.status', 'paid')
            ->select(DB::raw('COALESCE(SUM(JSON_LENGTH(tickets.seats) * routes.price), 0) as gross_sales'))
            ->value('gross_sales');

        $totalRevenue = (float) Payment::query()
            ->whereIn('status', ['success', 'paid'])
            ->sum('commission_amount');
        $totalReservations = Ticket::query()
            ->where('status', 'paid')
            ->count();

        return response()->json([
            'total_revenue' => round($totalRevenue, 2),
            'gross_sales' => round($grossSales, 2),
            'total_tickets' => $totalReservations,
            'total_routes' => Route::count(),
            'total_companies' => Company::count(),
            'total_users' => User::count(),
        ]);
    }
}
