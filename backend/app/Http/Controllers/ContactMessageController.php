<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        AdminNotification::create([
            'type' => 'contact_message',
            'title' => 'Nouveau message contact',
            'message' => "{$validated['name']} a envoye un message : {$validated['subject']}",
            'data' => [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'subject' => $validated['subject'],
                'message' => $validated['message'],
            ],
        ]);

        return response()->json([
            'message' => 'Message envoye avec succes.',
        ], 201);
    }

    public function storeCompanySupport(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $user = $request->user();
        $company = $user?->company;
        $companyName = $company?->name ?? $user?->name ?? 'Compagnie';

        AdminNotification::create([
            'type' => 'company_support_message',
            'title' => 'Demande technique compagnie',
            'message' => "{$companyName} a signale un probleme : {$validated['subject']}",
            'data' => [
                'company_id' => $company?->id,
                'company_name' => $companyName,
                'name' => $user?->name,
                'email' => $user?->email,
                'subject' => $validated['subject'],
                'message' => $validated['message'],
            ],
        ]);

        return response()->json([
            'message' => 'Votre demande a ete envoyee au superadmin.',
        ], 201);
    }
}
