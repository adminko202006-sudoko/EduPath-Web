<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_permissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('staff_id')
                ->unique()
                ->constrained('staff')
                ->cascadeOnDelete();

            $table->boolean('manage_admissions')->default(true);
            $table->boolean('verify_documents')->default(true);
            $table->boolean('manage_exams')->default(false);
            $table->boolean('manage_scholarships')->default(false);
            $table->boolean('manage_announcements')->default(false);
            $table->boolean('send_notifications')->default(false);
            $table->boolean('view_reports')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_permissions');
    }
};