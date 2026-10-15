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
        Schema::table('admission_periods', function (Blueprint $table) {
            $table->string('academic_year', 9)
                ->after('name');

            $table->string('admission_type', 100)
                ->default('Incoming Freshman')
                ->after('academic_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admission_periods', function (Blueprint $table) {
            $table->dropColumn([
                'academic_year',
                'admission_type',
            ]);
        });
    }
};