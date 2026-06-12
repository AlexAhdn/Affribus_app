<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('users', function (Blueprint $blueprint) {
        // On n'ajoute 'role' que s'il n'existe pas
        if (!Schema::hasColumn('users', 'role')) {
            $blueprint->string('role')->default('client')->after('email');
        }

        // On n'ajoute 'company_id' que s'il n'existe pas
        if (!Schema::hasColumn('users', 'company_id')) {
            $blueprint->foreignId('company_id')
                      ->nullable()
                      ->after('email') // ou après 'role' si tu préfères
                      ->constrained()
                      ->nullOnDelete();
        }

        // On vérifie aussi pour 'phone'
        if (!Schema::hasColumn('users', 'phone')) {
            $blueprint->string('phone')->nullable()->after('email');
        }
    });
}

    public function down(): void
    {
        Schema::table('users', function (Blueprint $blueprint) {
            $blueprint->dropForeign(['company_id']);
            $blueprint->dropColumn(['role', 'company_id', 'phone']);
        });
    }
};