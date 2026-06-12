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
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'route_id')) {
                $table->foreignId('route_id')->nullable()->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('tickets', 'customer_name')) {
                $table->string('customer_name')->nullable();
            }

            if (!Schema::hasColumn('tickets', 'seats')) {
                $table->json('seats')->nullable();
            }

            if (!Schema::hasColumn('tickets', 'travel_date')) {
                $table->date('travel_date')->nullable();
            }

            if (!Schema::hasColumn('tickets', 'transaction_id')) {
                $table->string('transaction_id')->nullable()->unique();
            }

            if (!Schema::hasColumn('tickets', 'status')) {
                $table->string('status')->default('paid');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'route_id')) {
                $table->dropConstrainedForeignId('route_id');
            }
            if (Schema::hasColumn('tickets', 'customer_name')) {
                $table->dropColumn('customer_name');
            }
            if (Schema::hasColumn('tickets', 'seats')) {
                $table->dropColumn('seats');
            }
            if (Schema::hasColumn('tickets', 'travel_date')) {
                $table->dropColumn('travel_date');
            }
            if (Schema::hasColumn('tickets', 'transaction_id')) {
                $table->dropUnique('tickets_transaction_id_unique');
                $table->dropColumn('transaction_id');
            }
            if (Schema::hasColumn('tickets', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
