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
    Schema::create('tickets', function (Blueprint $table) {
        $table->id();
        $table->foreignId('route_id')->constrained()->onDelete('cascade');
        $table->string('customer_name');
        $table->json('seats'); // On stocke un tableau ['A1', 'A2']
        $table->date('travel_date'); // Très important pour le filtrage
        $table->string('transaction_id')->unique();
        $table->string('status')->default('paid'); 
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
