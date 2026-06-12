<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifie.'], 401);
        }

        if (!in_array($user->role, ['admin', 'super_admin'], true) || $user->company_id !== null) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        if ($user->is_blocked) {
            return response()->json(['message' => 'Compte bloque.'], 403);
        }

        return $next($request);
    }
}
