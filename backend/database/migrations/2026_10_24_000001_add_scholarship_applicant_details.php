<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->json('application_details')->nullable();
            $table->string('supporting_document_path')->nullable();
            $table->string('supporting_document_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('scholarship_applications', fn (Blueprint $table) => $table->dropColumn([
            'application_details', 'supporting_document_path', 'supporting_document_name',
        ]));
    }
};
