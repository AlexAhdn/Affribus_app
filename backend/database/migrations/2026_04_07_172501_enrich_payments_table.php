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
            if (!Schema::hasColumn('payments', 'booking_id')) {
                $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('payments', 'ticket_id')) {
                $table->foreignId('ticket_id')->nullable()->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('payments', 'transaction_id')) {
                $table->string('transaction_id')->nullable()->unique();
            }
            if (!Schema::hasColumn('payments', 'amount')) {
                $table->decimal('amount', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('payments', 'method')) {
                $table->string('method')->default('kkiapay');
            }
            if (!Schema::hasColumn('payments', 'status')) {
                $table->string('status')->default('paid');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'booking_id')) {
                $table->dropConstrainedForeignId('booking_id');
            }
            if (Schema::hasColumn('payments', 'ticket_id')) {
                $table->dropConstrainedForeignId('ticket_id');
            }
            if (Schema::hasColumn('payments', 'transaction_id')) {
                $table->dropUnique('payments_transaction_id_unique');
                $table->dropColumn('transaction_id');
            }
            if (Schema::hasColumn('payments', 'amount')) {
                $table->dropColumn('amount');
            }
            if (Schema::hasColumn('payments', 'method')) {
                $table->dropColumn('method');
            }
            if (Schema::hasColumn('payments', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
