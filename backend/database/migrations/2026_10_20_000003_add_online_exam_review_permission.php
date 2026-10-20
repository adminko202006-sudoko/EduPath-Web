<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_permissions', fn (Blueprint $table) => $table->boolean('review_online_exams')->default(false));
    }

    public function down(): void
    {
        Schema::table('staff_permissions', fn (Blueprint $table) => $table->dropColumn('review_online_exams'));
    }
};
