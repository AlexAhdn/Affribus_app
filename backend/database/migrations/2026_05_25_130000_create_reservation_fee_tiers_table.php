<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_fee_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->decimal('min_price', 10, 2)->default(0);
            $table->decimal('max_price', 10, 2)->nullable();
            $table->decimal('fee', 10, 2)->default(0);
            $table->unsignedInteger('position')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        DB::table('reservation_fee_tiers')->insert([
            ['label' => 'Moins de 5 000 FCFA', 'min_price' => 0, 'max_price' => 4999, 'fee' => 50, 'position' => 1, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'De 5 000 a 6 999 FCFA', 'min_price' => 5000, 'max_price' => 6999, 'fee' => 100, 'position' => 2, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'De 7 000 a 9 999 FCFA', 'min_price' => 7000, 'max_price' => 9999, 'fee' => 150, 'position' => 3, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'De 10 000 a 14 999 FCFA', 'min_price' => 10000, 'max_price' => 14999, 'fee' => 200, 'position' => 4, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'De 15 000 a 19 999 FCFA', 'min_price' => 15000, 'max_price' => 19999, 'fee' => 300, 'position' => 5, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => '20 000 FCFA et plus', 'min_price' => 20000, 'max_price' => null, 'fee' => 500, 'position' => 6, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_fee_tiers');
    }
};
