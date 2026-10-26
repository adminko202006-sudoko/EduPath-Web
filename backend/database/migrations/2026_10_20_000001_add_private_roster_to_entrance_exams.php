<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('entrance_exams', function (Blueprint $table) {
            $table->string('roster_pdf_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('entrance_exams', fn (Blueprint $table) => $table->dropColumn('roster_pdf_path'));
    }
};
