<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserAdminController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $users = User::query()
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 10));

        return response()->json($users);
    }

    public function toggleBlock($id)
    {
        $user = User::findOrFail($id);
        $user->is_blocked = !$user->is_blocked;
        $user->save();

        return response()->json($user);
    }

    public function bookings($id)
    {
        $user = User::findOrFail($id);
        $bookings = $user->bookings()
            ->with('route.company:id,name')
            ->orderByDesc('id')
            ->paginate(10);

        return response()->json($bookings);
    }
}
