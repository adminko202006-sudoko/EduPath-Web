<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('online_exam_attempts', function (Blueprint $table) {
            // Existing attempts retain the fixed-window rules they started with.
            $table->unsignedTinyInteger('navigation_mode')->default(1);
            $table->unsignedInteger('viewed_question_index')->default(0);
            $table->unsignedInteger('navigation_revision')->default(0);
        });
    }

    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::table('online_exam_attempts')->where('navigation_mode', 2)->exists()) {
            throw new RuntimeException('Attempts using navigation exist. Their timing state must be retained.');
        }
        Schema::table('online_exam_attempts', fn (Blueprint $table) => $table->dropColumn(['navigation_mode', 'viewed_question_index', 'navigation_revision']));
    }
};
