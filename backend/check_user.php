<?php

require_once 'vendor/autoload.php';

use App\Models\User;

$user = User::where('email', 'votre-email@example.com')->first();

if ($user) {
    echo "ID: " . $user->id . "\n";
    echo "Email: " . $user->email . "\n";
    echo "Role: " . $user->role . "\n";
    echo "Blocked: " . ($user->is_blocked ? 'Yes' : 'No') . "\n";
} else {
    echo "Utilisateur non trouvé\n";
}
