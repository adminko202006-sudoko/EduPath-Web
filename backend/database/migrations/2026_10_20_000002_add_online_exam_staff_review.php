<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_exam_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('online_exam_attempt_id')->constrained('online_exam_attempts')->restrictOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recommendation', 40);
            $table->text('remarks');
            $table->timestamps();
            $table->unique(['online_exam_attempt_id', 'reviewed_by']);
        });
    }

    public function down(): void
    {
        // Reviews are institutional records; rollback must not silently discard them.
        if (\Illuminate\Support\Facades\DB::table('online_exam_reviews')->exists()) {
            throw new RuntimeException('Online exam reviews exist; archive them through an authorized retention process before rollback.');
        }
        Schema::dropIfExists('online_exam_reviews');
    }
};
