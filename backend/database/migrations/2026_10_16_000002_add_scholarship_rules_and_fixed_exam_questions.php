<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scholarships', function (Blueprint $table) {
            $table->string('category', 40)->default('other')->after('program_type');
            $table->boolean('requires_online_exam')->default(false)->after('category');
            $table->boolean('requires_face_to_face_exam')->default(false)->after('requires_online_exam');
            $table->boolean('unlimited_awards')->default(false)->after('available_slots');
            $table->boolean('admission_approval_required')->default(true)->after('unlimited_awards');
            $table->unsignedSmallInteger('exam_question_count')->default(100)->after('unlimited_awards');
            $table->unsignedSmallInteger('exam_seconds_per_question')->default(60)->after('exam_question_count');
            $table->unsignedSmallInteger('exam_passing_score')->default(50)->after('exam_seconds_per_question');
        });

        // Classify existing records by recognizable program names/providers.
        // Unrecognized existing scholarships default to the project's Other category;
        // administrators can correct the category in the scholarship editor.
        \Illuminate\Support\Facades\DB::table('scholarships')
            ->whereRaw("LOWER(CONCAT(COALESCE(name, ''), ' ', COALESCE(provider, ''))) LIKE '%unifast%' AND LOWER(COALESCE(name, '')) NOT LIKE '%tertiary education subsidy%' AND LOWER(COALESCE(name, '')) NOT LIKE '%tes%' AND LOWER(COALESCE(name, '')) NOT LIKE '%tdp%'")
            ->update([
                'category' => 'unifast',
                'requires_online_exam' => false,
                'requires_face_to_face_exam' => true,
                'unlimited_awards' => false,
            ]);

        \Illuminate\Support\Facades\DB::table('scholarships')
            ->whereRaw("LOWER(COALESCE(name, '')) LIKE '%tertiary education subsidy%' OR LOWER(CONCAT(COALESCE(name, ''), ' ', COALESCE(provider, ''))) LIKE '%tes%' OR LOWER(CONCAT(COALESCE(name, ''), ' ', COALESCE(provider, ''))) LIKE '%tdp%'")
            ->update([
                'category' => 'tes_tdp',
                'requires_online_exam' => false,
                'requires_face_to_face_exam' => false,
                'unlimited_awards' => false,
            ]);

        \Illuminate\Support\Facades\DB::table('scholarships')
            ->where('category', 'other')
            ->update([
                'requires_online_exam' => true,
                'requires_face_to_face_exam' => false,
                'unlimited_awards' => true,
                'exam_question_count' => 100,
                'exam_seconds_per_question' => 60,
                'exam_passing_score' => 50,
            ]);

        Schema::table('online_exam_attempts', function (Blueprint $table) {
            $table->boolean('passed')->nullable()->after('score');
            $table->unsignedBigInteger('results_released_by')->nullable()->after('results_released_at');
        });

        Schema::create('online_exam_attempt_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('online_exam_attempt_id')->constrained('online_exam_attempts')->cascadeOnDelete();
            $table->foreignId('online_exam_question_id')->constrained('online_exam_questions')->restrictOnDelete();
            $table->unsignedSmallInteger('position');
            $table->timestamps();
            $table->unique(['online_exam_attempt_id', 'online_exam_question_id'], 'attempt_question_unique');
            $table->unique(['online_exam_attempt_id', 'position'], 'attempt_position_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_exam_attempt_questions');
        Schema::table('online_exam_attempts', function (Blueprint $table) {
            $table->dropColumn(['passed', 'results_released_by']);
        });
        Schema::table('scholarships', function (Blueprint $table) {
            $table->dropColumn([
                'category', 'requires_online_exam', 'requires_face_to_face_exam',
                'unlimited_awards', 'admission_approval_required', 'exam_question_count',
                'exam_seconds_per_question', 'exam_passing_score',
            ]);
        });
    }
};
