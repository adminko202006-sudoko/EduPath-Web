<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_onboarding_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('tutorial_key', 50)->default('applicant');
            $table->unsignedInteger('tutorial_version');
            $table->string('status', 20)->default('not_started');
            $table->string('current_step_id', 40)->default('welcome');
            $table->string('enrollment_source', 30);
            $table->unsignedInteger('revision')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('skipped_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'tutorial_key', 'tutorial_version'], 'user_onboarding_version_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_onboarding_states');
    }
};
