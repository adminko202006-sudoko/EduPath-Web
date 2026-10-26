<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('workflow_events', function (Blueprint $t) {
            $t->id();
            $t->string('subject_type', 40);
            $t->unsignedBigInteger('subject_id');
            $t->unsignedBigInteger('actor_id')->nullable()->index();
            $t->string('action', 80);
            $t->string('old_status', 40)->nullable();
            $t->string('new_status', 40)->nullable();
            $t->text('remarks')->nullable();
            $t->timestamps();
            $t->index(['subject_type', 'subject_id']);
        });
        Schema::table('scholarship_applications', function (Blueprint $t) {
            // Existing approvals remain approvals for eligibility, never inferred awards.
            $t->string('award_status', 30)->default('undecided');
            $t->unsignedBigInteger('award_decided_by')->nullable();
            $t->timestamp('award_decided_at')->nullable();
            $t->text('award_remarks')->nullable();
            $t->unsignedInteger('award_revision')->default(0);
        });
        Schema::table('announcements', fn (Blueprint $t) => $t->boolean('dispatch_pending')->default(false));
        Schema::create('notification_preferences', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('user_id')->unique();
            $t->json('preferences'); $t->unsignedInteger('revision')->default(0); $t->timestamps();
        });
        Schema::create('notification_deliveries', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('notification_id')->unique();
            $t->string('status', 20)->default('pending')->index();
            $t->unsignedInteger('attempts')->default(0);
            $t->timestamp('available_at')->nullable();
            $t->timestamp('locked_until')->nullable();
            $t->string('last_error')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_deliveries');
        Schema::dropIfExists('notification_preferences');
        Schema::table('scholarship_applications', fn (Blueprint $t) => $t->dropColumn(['award_status','award_decided_by','award_decided_at','award_remarks','award_revision']));
        Schema::table('announcements', fn (Blueprint $t) => $t->dropColumn('dispatch_pending'));
        Schema::dropIfExists('workflow_events');
    }
};
