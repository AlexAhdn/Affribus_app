<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'phone' => 'required|string|max:50|unique:users,phone',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['role'] = 'client';

        $user = User::create($validated);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user,
        ], 201);
    }

    /**
     * Login a user
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required_without:identifier|string',
            'identifier' => 'required_without:email|string',
            'password' => 'required|string',
        ]);

        $identifier = $validated['identifier'] ?? $validated['email'];
        $user = User::with(['company', 'station:id,name,city,address'])
            ->where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Email, telephone ou mot de passe incorrect',
            ], 401);
        }

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

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'company_id' => $user->company_id,
                'company_name' => $user->company?->name,
                'station_id' => $user->station_id,
                'station' => $user->station,
            ],
            'token' => $user->createToken('auth_token')->plainTextToken,
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
