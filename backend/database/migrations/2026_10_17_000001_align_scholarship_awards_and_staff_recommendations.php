<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fail safely instead of deleting or merging applicant history if legacy duplicates exist.
        $duplicates = DB::table('scholarship_applications')
            ->select('applicant_id', 'scholarship_id', DB::raw('COUNT(*) as total'))
            ->groupBy('applicant_id', 'scholarship_id')
            ->havingRaw('COUNT(*) > 1')
            ->first();
        if ($duplicates) {
            throw new \RuntimeException('Duplicate scholarship applications exist. Resolve duplicates before applying the unique constraint; no application records were changed.');
        }

        Schema::table('scholarships', function (Blueprint $table) {
            $table->dateTime('application_start_at')->nullable()->after('application_start');
            $table->dateTime('application_end_at')->nullable()->after('application_end');
        });

        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->enum('staff_recommendation', ['recommended', 'not_recommended', 'needs_information'])->nullable()->after('remarks');
            $table->text('staff_recommendation_remarks')->nullable()->after('staff_recommendation');
            $table->unsignedBigInteger('staff_recommended_by')->nullable()->after('staff_recommendation_remarks');
            $table->timestamp('staff_recommended_at')->nullable()->after('staff_recommended_by');
            $table->unique(['applicant_id', 'scholarship_id'], 'scholarship_applications_applicant_scholarship_unique');
        });

        // Existing slot values are obsolete under the approved no-fixed-slots rule.
        DB::table('scholarships')->update(['available_slots' => null, 'unlimited_awards' => true]);
    }

    public function down(): void
    {
        Schema::table('scholarships', function (Blueprint $table) {
            $table->dropColumn(['application_start_at', 'application_end_at']);
        });

        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->dropUnique('scholarship_applications_applicant_scholarship_unique');
            $table->dropColumn([
                'staff_recommendation',
                'staff_recommendation_remarks',
                'staff_recommended_by',
                'staff_recommended_at',
            ]);
        });
    }
};
