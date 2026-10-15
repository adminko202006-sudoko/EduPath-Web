<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type')->default('general')->after('message');
            $table->foreignId('announcement_id')
                ->nullable()
                ->after('type')
                ->constrained('announcements')
                ->cascadeOnDelete();

            $table->index(['user_id', 'type', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'type', 'is_read']);
            $table->dropConstrainedForeignId('announcement_id');
            $table->dropColumn('type');
        });
    }
};
