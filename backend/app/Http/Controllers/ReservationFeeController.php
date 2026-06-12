<?php

namespace App\Http\Controllers;

use App\Models\ReservationFeeTier;
use Illuminate\Http\Request;

class ReservationFeeController extends Controller
{
    public function index()
    {
        return response()->json(
            ReservationFeeTier::query()
                ->where('active', true)
                ->orderBy('position')
                ->orderBy('min_price')
                ->get()
        );
    }

    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $quantity = (int) ($validated['quantity'] ?? 1);
        $feePerTicket = ReservationFeeTier::feeForPrice((float) $validated['price']);

        return response()->json([
            'fee_per_ticket' => $feePerTicket,
            'quantity' => $quantity,
            'total_fee' => $feePerTicket * $quantity,
        ]);
    }
}
