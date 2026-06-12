<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyAdminController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $companies = Company::query()
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->withCount('routes')
            ->withCount(['routes as tickets_sold_count' => function ($query) {
                $query->join('tickets', 'tickets.route_id', '=', 'routes.id')
                    ->where('tickets.status', 'paid');
            }])
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 10));

        return response()->json($companies);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:companies,email|unique:users,email',
            'phone' => 'required|string|max:50',
            'logo' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,active,inactive',
            'commission_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $company = DB::transaction(function () use ($validated) {
            $company = Company::create([
                ...$validated,
                'status' => $validated['status'] ?? 'active',
            ]);

            $user = User::create([
                'name' => $company->name,
                'email' => $company->email,
                'password' => $company->phone,
                'phone' => $company->phone,
                'role' => 'admin',
                'company_id' => $company->id,
                'is_blocked' => false,
            ]);

            $company->update([
                'user_id' => $user->id,
            ]);

            return $company->loadCount([
                'routes',
                'routes as tickets_sold_count' => function ($query) {
                    $query->join('tickets', 'tickets.route_id', '=', 'routes.id')
                        ->where('tickets.status', 'paid');
                },
            ]);
        });

        return response()->json($company, 201);
    }

    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);
        $user = User::where('company_id', $company->id)->first();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:companies,email,' . $company->id . '|unique:users,email,' . ($user?->id ?? 'NULL'),
            'phone' => 'sometimes|required|string|max:50',
            'logo' => 'nullable|string|max:255',
            'status' => 'sometimes|required|in:pending,active,inactive',
            'commission_percent' => 'sometimes|numeric|min:0|max:100',
        ]);

        DB::transaction(function () use ($company, $user, $validated) {
            $company->update($validated);

            if ($user) {
                $user->update([
                    'name' => $validated['name'] ?? $company->name,
                    'email' => $validated['email'] ?? $company->email,
                    'phone' => $validated['phone'] ?? $company->phone,
                    'password' => $validated['phone'] ?? $user->password,
                ]);
            }
        });

        return response()->json($company->fresh());
    }

    public function destroy($id)
    {
        $company = Company::findOrFail($id);

        DB::transaction(function () use ($company) {
            User::where('company_id', $company->id)->delete();
            $company->delete();
        });

        return response()->json(['message' => 'Compagnie supprimée.']);
    }

    public function toggleStatus($id)
    {
        $company = Company::findOrFail($id);
        $company->status = $company->status === 'active' ? 'inactive' : 'active';
        $company->save();

        return response()->json($company);
    }

    public function approve($id)
    {
        $company = Company::findOrFail($id);

        DB::transaction(function () use ($company) {
            $company->update(['status' => 'active']);

            User::where('company_id', $company->id)
                ->where('id', $company->user_id)
                ->update(['is_blocked' => false]);
        });

        return response()->json($company->fresh()->loadCount([
            'routes',
            'routes as tickets_sold_count' => function ($query) {
                $query->join('tickets', 'tickets.route_id', '=', 'routes.id')
                    ->where('tickets.status', 'paid');
            },
        ]));
    }
}
