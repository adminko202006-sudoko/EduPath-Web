<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            $table->enum('status', [
                'pending',
                'under_review',
                'approved',
                'rejected',
                'withdrawn',
            ])->default('pending')->change();
        });
    }

    public function down(): void
    {
        if (DB::table('admission_applications')->where('status', 'withdrawn')->exists()) {
            throw new RuntimeException(
                'Cannot remove the withdrawn status while withdrawn admission records exist.'
            );
        }

        Schema::table('admission_applications', function (Blueprint $table) {
            $table->enum('status', [
                'pending',
                'under_review',
                'approved',
                'rejected',
            ])->default('pending')->change();
        });
    }
};
