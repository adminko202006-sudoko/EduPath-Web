<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_programs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('staff_id')
                ->constrained('staff')
                ->cascadeOnDelete();

            $table->foreignId('academic_program_id')
                ->constrained('academic_programs')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['staff_id', 'academic_program_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_programs');
    }
};