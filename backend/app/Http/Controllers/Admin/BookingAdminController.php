<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class BookingAdminController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $date = $request->query('date');

        $bookings = Ticket::query()
            ->with(['route.company:id,name', 'route:id,company_id,departure_city,arrival_city,price', 'user:id,name,email,phone'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($date, fn ($query) => $query->whereDate('travel_date', $date))
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 10));

        $bookings->getCollection()->transform(function ($booking) {
            $seatCount = is_array($booking->seats) ? count($booking->seats) : 0;
            $price = (float) ($booking->route?->price ?? 0);
            $booking->amount = round($seatCount * $price, 2);
            $booking->client = $booking->customer_name ?? '—';
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
}
