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
        Schema::table('scholarships', function (Blueprint $table) {

            // Basic scholarship information
            $table->string('provider')->nullable()->after('name');
            $table->string('program_type')->nullable()->after('provider');

            // Program purpose
            $table->text('objectives')->nullable()->after('description');
            $table->text('goals')->nullable()->after('objectives');
            $table->text('target_beneficiaries')->nullable()->after('goals');

            // Scholarship benefits
            $table->text('benefits')->nullable()->after('requirements');
            $table->text('covered_expenses')->nullable()->after('benefits');

            // Additional program information
            $table->unsignedInteger('available_slots')->nullable()->after('application_end');
            $table->text('renewal_requirements')->nullable()->after('available_slots');
            $table->string('official_reference')->nullable()->after('renewal_requirements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scholarships', function (Blueprint $table) {
            $table->dropColumn([
                'provider',
                'program_type',
                'objectives',
                'goals',
                'target_beneficiaries',
                'benefits',
                'covered_expenses',
                'available_slots',
                'renewal_requirements',
                'official_reference',
            ]);
        });
    }
};
