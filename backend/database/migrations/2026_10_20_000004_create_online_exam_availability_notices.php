<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_exam_availability_notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('applicants')->restrictOnDelete();
            $table->unsignedInteger('attempt_number');
            $table->foreignId('notification_id')->nullable()->constrained('notifications')->nullOnDelete();
            $table->timestamps();
            $table->unique(['applicant_id', 'attempt_number'], 'exam_availability_applicant_attempt_unique');
        });
    }

    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::table('online_exam_availability_notices')->exists()) {
            throw new RuntimeException('Availability notice records exist; archive them through an authorized retention process before rollback.');
        }
        Schema::dropIfExists('online_exam_availability_notices');
    }
};
