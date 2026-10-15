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
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('applicant_id')
                ->constrained('applicants')
                ->onDelete('cascade');

            $table->foreignId('academic_program_id')
                ->constrained('academic_programs')
                ->onDelete('restrict');

            $table->enum('status', [
                'pending',
                'under_review',
                'approved',
                'rejected'
            ])->default('pending');

            $table->text('remarks')->nullable();

            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
    }
};
