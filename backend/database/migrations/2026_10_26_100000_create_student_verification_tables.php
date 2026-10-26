<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->unique()->constrained()->restrictOnDelete();
            $table->string('student_type', 20);
            $table->string('lrn', 12)->unique();
            $table->string('tmc_student_number', 50)->nullable()->unique();
            $table->string('previous_school');
            $table->string('school_id_path');
            $table->string('status', 20)->default('pending')->index();
            $table->foreignId('academic_program_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('feedback')->nullable();
            $table->unsignedInteger('revision')->default(1);
            $table->timestamps();
        });
        Schema::create('student_verification_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_verification_id')->constrained()->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 30);
            $table->json('snapshot');
            $table->timestamps();
        });
        Schema::create('email_verification_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('sent_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_verification_codes');
        Schema::dropIfExists('student_verification_events');
        Schema::dropIfExists('student_verifications');
    }
};
