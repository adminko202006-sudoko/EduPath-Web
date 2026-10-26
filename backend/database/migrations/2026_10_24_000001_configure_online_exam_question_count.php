<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('online_exam_settings', function (Blueprint $table) {
            $table->unsignedInteger('required_question_count')->default(100);
        });
        Schema::table('online_exam_attempts', function (Blueprint $table) {
            // Preserve the review rule of attempts started before this update.
            $table->unsignedInteger('review_cutoff_seconds')->default(25);
        });
    }

    public function down(): void
    {
        Schema::table('online_exam_attempts', fn (Blueprint $table) => $table->dropColumn('review_cutoff_seconds'));
        Schema::table('online_exam_settings', fn (Blueprint $table) => $table->dropColumn('required_question_count'));
    }
};
