<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::create('bookings', function (Blueprint $table) {
        $table->id();

        $table->unsignedBigInteger('route_id');
        $table->date('travel_date');

        $table->json('seats'); // ex: [1,2,3]

        $table->string('first_name');
        $table->string('last_name');
        $table->string('email');

        $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');

        $table->timestamp('expires_at')->nullable(); // pour expiration

        $table->timestamps();

        // relation
        $table->foreign('route_id')->references('id')->on('routes')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
