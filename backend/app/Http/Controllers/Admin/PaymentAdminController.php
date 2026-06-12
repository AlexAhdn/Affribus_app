<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentAdminController extends Controller
{
    public function index(Request $request)
    {
        $payments = Payment::query()
            ->with('ticket:id,route_id,customer_name,seats')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 10));

        return response()->json($payments);
    }
}
