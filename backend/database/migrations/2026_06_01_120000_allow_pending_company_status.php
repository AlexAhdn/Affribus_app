<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('companies', 'status')) {
            DB::statement("ALTER TABLE companies MODIFY status ENUM('pending','active','inactive') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('companies', 'status')) {
            DB::statement("UPDATE companies SET status = 'inactive' WHERE status = 'pending'");
            DB::statement("ALTER TABLE companies MODIFY status ENUM('active','inactive') NOT NULL DEFAULT 'active'");
        }
    }
};
