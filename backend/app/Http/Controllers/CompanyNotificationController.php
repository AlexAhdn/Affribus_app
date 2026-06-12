<?php

namespace App\Http\Controllers;

use App\Models\CompanyNotification;
use Illuminate\Http\Request;

class CompanyNotificationController extends Controller
{
    public function index(Request $request)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'Aucune compagnie liee a cet utilisateur.'], 404);
        }

        $notifications = CompanyNotification::query()
            ->where('company_id', $company->id)
            ->orderByDesc('created_at')
            ->paginate((int) $request->query('per_page', 30));

        return response()->json([
            'unread_count' => CompanyNotification::query()
                ->where('company_id', $company->id)
                ->whereNull('read_at')
                ->count(),
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'Aucune compagnie liee a cet utilisateur.'], 404);
        }

        $notification = CompanyNotification::query()
            ->where('company_id', $company->id)
            ->findOrFail($id);

        $notification->update(['read_at' => now()]);

        return response()->json($notification);
    }

    public function markAllAsRead(Request $request)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'Aucune compagnie liee a cet utilisateur.'], 404);
        }

        CompanyNotification::query()
            ->where('company_id', $company->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Notifications marquees comme lues.']);
    }
}
