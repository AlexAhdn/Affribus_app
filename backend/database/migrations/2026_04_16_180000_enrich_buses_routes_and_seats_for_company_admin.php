<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            if (!Schema::hasColumn('buses', 'company_id')) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('buses', 'name')) {
                $table->string('name')->nullable()->after('company_id');
            }

            if (!Schema::hasColumn('buses', 'registration_number')) {
                $table->string('registration_number')->nullable()->after('name');
            }

            if (!Schema::hasColumn('buses', 'seat_count')) {
                $table->unsignedInteger('seat_count')->default(0)->after('registration_number');
            }
        });

        Schema::table('seats', function (Blueprint $table) {
            if (!Schema::hasColumn('seats', 'bus_id')) {
                $table->foreignId('bus_id')->nullable()->after('id')->constrained('buses')->cascadeOnDelete();
            }

            if (!Schema::hasColumn('seats', 'number')) {
                $table->unsignedInteger('number')->default(0)->after('bus_id');
            }
        });

        Schema::table('routes', function (Blueprint $table) {
            if (!Schema::hasColumn('routes', 'bus_id')) {
                $table->foreignId('bus_id')->nullable()->after('company_id')->constrained('buses')->nullOnDelete();
            }
        });

        if (Schema::hasColumns('buses', ['id', 'seat_count']) && Schema::hasColumns('seats', ['bus_id', 'number'])) {
            DB::table('buses')->orderBy('id')->get()->each(function ($bus) {
                if (($bus->seat_count ?? 0) < 1) {
                    return;
                }

                $existing = DB::table('seats')->where('bus_id', $bus->id)->count();
                if ($existing > 0) {
                    return;
                }

                $rows = [];
                for ($i = 1; $i <= $bus->seat_count; $i++) {
                    $rows[] = [
                        'bus_id' => $bus->id,
                        'number' => $i,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                DB::table('seats')->insert($rows);
            });
        }
    }

    public function down(): void
    {
        Schema::table('routes', function (Blueprint $table) {
            if (Schema::hasColumn('routes', 'bus_id')) {
                $table->dropConstrainedForeignId('bus_id');
            }
        });

        Schema::table('seats', function (Blueprint $table) {
            if (Schema::hasColumn('seats', 'bus_id')) {
                $table->dropConstrainedForeignId('bus_id');
            }

            if (Schema::hasColumn('seats', 'number')) {
                $table->dropColumn('number');
            }
        });

        Schema::table('buses', function (Blueprint $table) {
            if (Schema::hasColumn('buses', 'company_id')) {
                $table->dropConstrainedForeignId('company_id');
            }

            foreach (['name', 'registration_number', 'seat_count'] as $column) {
                if (Schema::hasColumn('buses', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
