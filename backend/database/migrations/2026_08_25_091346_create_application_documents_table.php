<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('admission_application_id')
                ->constrained('admission_applications')
                ->onDelete('cascade');

            $table->string('document_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();

            $table->enum('status', [
                'pending',
                'verified',
                'rejected'
            ])->default('pending');

            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_documents');
    }
};
