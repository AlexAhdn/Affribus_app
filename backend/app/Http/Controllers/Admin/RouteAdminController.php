<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use Illuminate\Http\Request;

class RouteAdminController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $routes = Route::query()
            ->with('company:id,name')
            ->when($search, function ($query) use ($search) {
                $query->where('departure_city', 'like', "%{$search}%")
                    ->orWhere('arrival_city', 'like', "%{$search}%");
            })
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 10));

        return response()->json($routes);
    }

    public function destroy($id)
    {
        $route = Route::findOrFail($id);
        $route->delete();

        return response()->json(['message' => 'Trajet supprimé.']);
    }
}
