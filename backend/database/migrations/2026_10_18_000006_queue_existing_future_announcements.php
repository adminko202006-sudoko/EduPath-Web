<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Honor previously scheduled future publications, without replaying old announcements.
        DB::table('announcements')->where('status','published')->where('published_at','>',now())->update(['dispatch_pending'=>true]);
    }

    public function down(): void
    {
        // Preserve any subsequently edited schedules and delivery state.
    }
};
