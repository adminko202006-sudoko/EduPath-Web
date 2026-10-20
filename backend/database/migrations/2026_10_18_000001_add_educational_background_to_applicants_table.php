<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->string('primary_school')->nullable();
            $table->string('primary_school_year', 4)->nullable();
            $table->string('junior_high_school')->nullable();
            $table->string('senior_high_school')->nullable();
            $table->string('shs_strand', 100)->nullable();
            $table->string('lrn', 12)->nullable();
            $table->string('previous_college_university')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn([
                'primary_school', 'primary_school_year', 'junior_high_school',
                'senior_high_school', 'shs_strand', 'lrn', 'previous_college_university',
            ]);
        });
    }
};
