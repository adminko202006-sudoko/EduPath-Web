<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |----------------------------------------------------------------------
        | Question bank
        |----------------------------------------------------------------------
        | The correct answer stays on the server: `is_correct` is never exposed
        | through any applicant-facing response.
        */

        Schema::create('online_exam_questions', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->boolean('is_active')->default(true);
            $table->string('source')->nullable();
            $table->timestamps();
        });

        Schema::create('online_exam_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('online_exam_question_id')
                ->constrained('online_exam_questions')
                ->onDelete('cascade');
            $table->string('text');
            $table->boolean('is_correct')->default(false);
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        /*
        |----------------------------------------------------------------------
        | Attempts and answers
        |----------------------------------------------------------------------
        */

        Schema::create('online_exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')
                ->constrained('applicants')
                ->onDelete('cascade');
            $table->enum('status', [
                'in_progress',
                'completed',
                'expired',
            ])->default('in_progress');
            $table->integer('question_count')->default(0);
            $table->integer('seconds_per_question')->default(60);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('current_question_index')->default(0);
            $table->decimal('score', 5, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('results_released_at')->nullable();
            $table->timestamps();

            $table->index('applicant_id');
        });

        Schema::create('online_exam_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('online_exam_attempt_id')
                ->constrained('online_exam_attempts')
                ->onDelete('cascade');
            $table->foreignId('online_exam_question_id')
                ->constrained('online_exam_questions')
                ->onDelete('cascade');
            $table->foreignId('online_exam_option_id')
                ->nullable()
                ->constrained('online_exam_options')
                ->onDelete('set null');
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['online_exam_attempt_id', 'online_exam_question_id'],
                'online_exam_answers_attempt_question_unique'
            );
        });

        /*
        |----------------------------------------------------------------------
        | Retake grants
        |----------------------------------------------------------------------
        | Only an administrator can create these rows (there is deliberately no
        | applicant route that writes to this table). The mobile client can
        | never grant itself a retake.
        */

        Schema::create('online_exam_retake_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')
                ->constrained('applicants')
                ->onDelete('cascade');
            $table->string('reason')->nullable();
            $table->unsignedBigInteger('granted_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_exam_retake_grants');
        Schema::dropIfExists('online_exam_answers');
        Schema::dropIfExists('online_exam_attempts');
        Schema::dropIfExists('online_exam_options');
        Schema::dropIfExists('online_exam_questions');
    }
};
