<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("
            ALTER TABLE application_documents
            MODIFY status ENUM('pending', 'approved', 'verified', 'rejected', 'under_review')
            NOT NULL DEFAULT 'pending'
        ");
        DB::statement("UPDATE application_documents SET status = 'verified' WHERE status = 'approved'");
        DB::statement("
            ALTER TABLE application_documents
            MODIFY status ENUM('pending', 'verified', 'rejected')
            NOT NULL DEFAULT 'pending'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
            ALTER TABLE application_documents
            MODIFY status ENUM('pending', 'approved', 'rejected')
            NOT NULL DEFAULT 'pending'
        ");
    }
};
