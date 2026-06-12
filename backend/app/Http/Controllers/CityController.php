<?php

namespace App\Http\Controllers;

use App\Models\Route;

class CityController extends Controller
{
    public function index()
    {
        $cityNames = Route::query()
            ->pluck('departure_city')
            ->merge(Route::query()->pluck('arrival_city'))
            ->filter()
            ->map(fn ($name) => trim($name))
            ->unique(fn ($name) => mb_strtolower($name))
            ->sort()
            ->values();

        return response()->json(
            $cityNames->map(fn ($name, $index) => [
                'id' => $index + 1,
                'name' => $name,
            ])
        );
    }
}
