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
        Schema::create('exam_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('entrance_exam_id')
                ->constrained('entrance_exams')
                ->onDelete('cascade');

            $table->foreignId('applicant_id')
                ->constrained('applicants')
                ->onDelete('cascade');

            $table->enum('status', [
                'scheduled',
                'completed',
                'absent'
            ])->default('scheduled');

            $table->decimal('score', 5, 2)->nullable();

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->unique([
                'entrance_exam_id',
                'applicant_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_assignments');
    }
};
