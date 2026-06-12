<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;

class StatsAdminController extends Controller
{
    public function salesPerDay()
    {
        $rows = Booking::query()
            ->join('routes', 'routes.id', '=', 'bookings.route_id')
            ->where('bookings.status', 'paid')
            ->selectRaw('travel_date as date, SUM(JSON_LENGTH(bookings.seats) * routes.price) as total')
            ->groupBy('travel_date')
            ->orderBy('travel_date')
            ->get();

        return response()->json($rows);
    }

    public function topRoutes()
    {
        $rows = Booking::query()
            ->join('routes', 'routes.id', '=', 'bookings.route_id')
            ->where('bookings.status', 'paid')
            ->select(
                'bookings.route_id',
                'routes.departure_city',
                'routes.arrival_city',
                DB::raw('SUM(JSON_LENGTH(bookings.seats)) as tickets_count'),
                DB::raw('SUM(JSON_LENGTH(bookings.seats) * routes.price) as total_sales')
            )
            ->groupBy('bookings.route_id', 'routes.departure_city', 'routes.arrival_city')
            ->orderByDesc('tickets_count')
            ->limit(10)
            ->get();

        return response()->json($rows);
    }

    public function topCompanies()
    {
        $rows = Booking::query()
            ->join('routes', 'routes.id', '=', 'bookings.route_id')
            ->join('companies', 'companies.id', '=', 'routes.company_id')
            ->where('bookings.status', 'paid')
            ->select(
                'companies.id',
                'companies.name',
                DB::raw('SUM(JSON_LENGTH(bookings.seats) * routes.price) as gross_sales'),
                DB::raw('AVG(companies.commission_percent) as commission_percent')
            )
            ->groupBy('companies.id', 'companies.name')
            ->orderByDesc('gross_sales')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $gross = (float) $row->gross_sales;
                $commissionRate = (float) $row->commission_percent;
                $platformRevenue = $gross * $commissionRate / 100;
                return [
                    'company_id' => $row->id,
                    'company_name' => $row->name,
                    'gross_sales' => round($gross, 2),
                    'platform_revenue' => round($platformRevenue, 2),
                    'company_revenue' => round($gross - $platformRevenue, 2),
                    'commission_percent' => round($commissionRate, 2),
                ];
            });

        return response()->json($rows);
    }
}
