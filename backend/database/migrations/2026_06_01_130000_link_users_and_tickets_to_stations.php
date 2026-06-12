<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'station_id')) {
                $table->foreignId('station_id')
                    ->nullable()
                    ->after('company_id')
                    ->constrained('stations')
                    ->nullOnDelete();
            }
        });

        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'boarding_station_id')) {
                $table->foreignId('boarding_station_id')
                    ->nullable()
                    ->after('boarding_station')
                    ->constrained('stations')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'boarding_station_id')) {
                $table->dropConstrainedForeignId('boarding_station_id');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'station_id')) {
                $table->dropConstrainedForeignId('station_id');
            }
        });
    }
};
