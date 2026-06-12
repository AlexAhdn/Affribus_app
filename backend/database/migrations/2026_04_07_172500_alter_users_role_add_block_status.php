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
        if (Schema::hasColumn('users', 'role')) {
            \Illuminate\Support\Facades\DB::statement(
                "ALTER TABLE users MODIFY role ENUM('client','company','admin','super_admin') NOT NULL DEFAULT 'client'"
            );
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 50)->default('client');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_blocked')) {
                $table->boolean('is_blocked')->default(false)->after('role');
            }
        });

        \Illuminate\Support\Facades\DB::table('users')
            ->where('role', 'company')
            ->update(['role' => 'admin']);

        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE users MODIFY role ENUM('client','admin','super_admin') NOT NULL DEFAULT 'client'"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_blocked')) {
                $table->dropColumn('is_blocked');
            }
        });
    }
};
