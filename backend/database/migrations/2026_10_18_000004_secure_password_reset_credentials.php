<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('password_reset_otps', function (Blueprint $table) {
            $table->string('reset_token_hash', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('password_reset_otps', fn (Blueprint $table) => $table->dropColumn('reset_token_hash'));
    }
};
