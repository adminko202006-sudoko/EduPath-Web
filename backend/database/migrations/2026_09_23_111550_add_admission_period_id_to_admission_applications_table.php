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
        Schema::table('admission_applications', function (Blueprint $table) {
            $table->foreignId('admission_period_id')
                ->nullable()
                ->after('academic_program_id')
                ->constrained('admission_periods')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            $table->dropForeign(['admission_period_id']);
            $table->dropColumn('admission_period_id');
        });
    }
};