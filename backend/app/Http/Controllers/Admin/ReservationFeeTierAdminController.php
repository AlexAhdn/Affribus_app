<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReservationFeeTier;
use Illuminate\Http\Request;

class ReservationFeeTierAdminController extends Controller
{
    public function index()
    {
        return response()->json(
            ReservationFeeTier::query()->orderBy('position')->orderBy('min_price')->get()
        );
    }

    public function update(Request $request, ReservationFeeTier $tier)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'min_price' => 'required|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0|gte:min_price',
            'fee' => 'required|numeric|min:0',
            'position' => 'required|integer|min:0',
            'active' => 'required|boolean',
        ]);

        $tier->update($validated);

        return response()->json($tier->fresh());
    }
}
