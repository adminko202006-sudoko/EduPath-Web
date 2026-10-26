<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('scholarships', fn (Blueprint $table) => $table->json('required_documents')->nullable());
        Schema::table('scholarship_applications', fn (Blueprint $table) => $table->json('requirement_documents')->nullable());
    }
    public function down(): void
    {
        Schema::table('scholarships', fn (Blueprint $table) => $table->dropColumn('required_documents'));
        Schema::table('scholarship_applications', fn (Blueprint $table) => $table->dropColumn('requirement_documents'));
    }
};
