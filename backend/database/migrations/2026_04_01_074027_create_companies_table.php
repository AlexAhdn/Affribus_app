<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();

            // Propriétaire de la compagnie (optionnel)

            $table->unsignedBigInteger('user_id')->nullable();
            // Infos compagnie
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');

            // Logo (pour frontend React)
            $table->string('logo')->nullable();

            // Statut (active / inactive)
            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};

