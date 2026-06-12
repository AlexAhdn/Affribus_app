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
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'commission_percent')) {
                $table->decimal('commission_percent', 5, 2)->default(1.00)->after('amount');
            }
            if (!Schema::hasColumn('payments', 'commission_amount')) {
                $table->decimal('commission_amount', 10, 2)->default(0)->after('commission_percent');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'commission_amount')) {
                $table->dropColumn('commission_amount');
            }
            if (Schema::hasColumn('payments', 'commission_percent')) {
                $table->dropColumn('commission_percent');
            }
        });
    }
};
