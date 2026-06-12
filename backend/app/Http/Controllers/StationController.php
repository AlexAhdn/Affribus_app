<?php

namespace App\Http\Controllers;

use App\Models\Station;
use Illuminate\Http\Request;

class StationController extends Controller
{
    public function index()
    {
        return response()->json(
            Station::with('company')
                ->orderBy('company_id')
                ->orderBy('name')
                ->get()
        );
    }

    public function stationsByCompany(Request $request, $company_id)
    {
        $stations = Station::query()
            ->where('company_id', $company_id)
            ->when($request->filled('city'), fn ($query) => $query->where('city', $request->query('city')))
            ->orderBy('name')
            ->get(['id', 'name', 'city', 'address']);

        return response()->json($stations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $station = Station::create($validated);

        return response()->json([
            'message' => 'Station ajoutee avec succes.',
            'station' => $station,
        ], 201);
    }

    public function show(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
