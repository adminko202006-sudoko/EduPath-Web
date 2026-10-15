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
        Schema::table('application_document_histories', function (Blueprint $table) {
            $table->dropForeign([
                'application_document_id',
            ]);
        });

        Schema::table('application_document_histories', function (Blueprint $table) {
            $table->foreignId('application_document_id')
                ->nullable()
                ->change();

            $table->foreign('application_document_id')
                ->references('id')
                ->on('application_documents')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('application_document_histories', function (Blueprint $table) {
            $table->dropForeign([
                'application_document_id',
            ]);
        });

        Schema::table('application_document_histories', function (Blueprint $table) {
            $table->foreignId('application_document_id')
                ->nullable(false)
                ->change();

            $table->foreign('application_document_id')
                ->references('id')
                ->on('application_documents')
                ->cascadeOnDelete();
        });
    }
};