<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Mode local/dev: autoriser l'accès admin sans Sanctum configuré.
        if (!$user && app()->environment('local')) {
            return $next($request);
        }

        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Réservé au super admin.'], 403);
        }

        if ($user->is_blocked) {
            return response()->json(['message' => 'Compte bloqué.'], 403);
        }

        return $next($request);
    }
}
