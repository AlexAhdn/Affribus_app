<?php

namespace App\Http\Controllers;

use App\Models\Buses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyBusController extends Controller
{
    public function index(Request $request)
    {
        $buses = Buses::query()
            ->withCount('seats')
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('id')
            ->get();

        return response()->json($buses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'registration_number' => 'required|string|max:100|unique:buses,registration_number',
            'seat_count' => 'required|integer|min:1|max:100',
        ]);

        $bus = DB::transaction(function () use ($validated, $request) {
            $bus = Buses::create([
                ...$validated,
                'company_id' => $request->user()->company_id,
            ]);

            $rows = [];
            for ($i = 1; $i <= $validated['seat_count']; $i++) {
                $rows[] = [
                    'bus_id' => $bus->id,
                    'number' => $i,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('seats')->insert($rows);

            return $bus->loadCount('seats');
        });

        return response()->json($bus, 201);
    }

    public function destroy(Request $request, string $id)
    {
        $bus = Buses::query()
            ->where('company_id', $request->user()->company_id)
            ->findOrFail($id);

        $bus->delete();

        return response()->json(['message' => 'Bus supprime avec succes.']);
    }
}
