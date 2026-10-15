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
        Schema::create('scholarship_applications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('applicant_id')
                ->constrained('applicants')
                ->onDelete('cascade');

            $table->foreignId('scholarship_id')
                ->constrained('scholarships')
                ->onDelete('cascade');

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
        Schema::dropIfExists('scholarship_applications');
    }
};
