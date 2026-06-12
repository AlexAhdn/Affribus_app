<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required_without:identifier|string',
            'identifier' => 'required_without:email|string',
            'password' => 'required|string'
        ]);

        // Vérifier l'email
        $identifier = $fields['identifier'] ?? $fields['email'];
        $user = User::with(['company', 'station:id,name,city,address'])
            ->where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        // Vérifier le mot de passe
        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json([
                'message' => 'Email, telephone ou mot de passe incorrect'
            ], 401);
        }

        // Créer le token de connexion (Sanctum)
        if ($user->company_id) {
            if ($user->company?->status === 'pending') {
                return response()->json([
                    'message' => 'Votre compagnie est en attente de validation par le superadmin.',
                ], 403);
            }

            if ($user->company?->status !== 'active' || $user->is_blocked) {
                return response()->json([
                    'message' => 'Votre compte compagnie est inactif. Contactez le support.',
                ], 403);
            }
        }

        $token = $user->createToken('afribustoken')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role, // Admin ou Company
                'company_id' => $user->company_id, // Sera null pour l'Admin
                'company_name' => $user->company?->name,
                'station_id' => $user->station_id,
                'station' => $user->station,
            ],
            'token' => $token
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }
}
