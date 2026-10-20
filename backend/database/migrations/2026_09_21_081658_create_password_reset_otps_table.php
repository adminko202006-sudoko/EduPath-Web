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
        Schema::create('password_reset_otps', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('email');

            // Hashed 6-digit OTP
            $table->string('otp_hash');

            // OTP expires after 10 minutes
            $table->timestamp('expires_at');

            // Number of failed verification attempts
            $table->unsignedTinyInteger('attempts')
                ->default(0);

            // Filled after successful OTP verification
            $table->timestamp('verified_at')
                ->nullable();

            $table->timestamps();

            $table->index(['email', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_reset_otps');
    }
};
