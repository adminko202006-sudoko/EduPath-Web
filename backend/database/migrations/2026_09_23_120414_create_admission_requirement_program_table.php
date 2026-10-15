<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_requirement_program', function (Blueprint $table) {
            $table->id();

            $table->foreignId('admission_requirement_id')
                ->constrained('admission_requirements')
                ->cascadeOnDelete();

            $table->foreignId('academic_program_id')
                ->constrained('academic_programs')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(
                ['admission_requirement_id', 'academic_program_id'],
                'req_program_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_requirement_program');
    }
};