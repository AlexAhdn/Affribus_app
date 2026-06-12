<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'validated_at')) {
                $table->timestamp('validated_at')->nullable()->after('amount');
            }

            if (!Schema::hasColumn('tickets', 'validated_by')) {
                $table->foreignId('validated_by')
                    ->nullable()
                    ->after('validated_at')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('tickets', 'validation_status')) {
                $table->string('validation_status')->default('unused')->after('validated_by');
            }

            if (!Schema::hasColumn('tickets', 'is_used')) {
                $table->boolean('is_used')->default(false)->after('validation_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'validated_by')) {
                $table->dropConstrainedForeignId('validated_by');
            }

            foreach (['validated_at', 'validation_status', 'is_used'] as $column) {
                if (Schema::hasColumn('tickets', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
