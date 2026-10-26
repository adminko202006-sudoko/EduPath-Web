<?php
namespace Tests\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

trait InstallsWorkflowSchema
{
    protected function installWorkflowSchema(): void
    {
        $this->installExamDocumentSchema();
        if(!Schema::hasTable('announcements'))Schema::create('announcements',function(Blueprint $t){$t->id();$t->string('title')->nullable();$t->text('content')->nullable();$t->string('status')->default('draft');$t->timestamp('published_at')->nullable();$t->timestamps();});
        if(!Schema::hasTable('scholarship_applications'))Schema::create('scholarship_applications',fn(Blueprint $t)=>$t->id());
        if(!Schema::hasTable('notifications'))Schema::create('notifications',function(Blueprint $t){$t->id();$t->unsignedBigInteger('user_id');$t->string('title');$t->text('message');$t->string('type')->nullable();$t->unsignedBigInteger('announcement_id')->nullable();$t->boolean('is_read')->default(false);$t->timestamp('read_at')->nullable();$t->timestamps();});
        (require database_path('migrations/2026_10_18_000005_add_workflow_accountability.php'))->up();
        (require database_path('migrations/2026_10_20_000004_create_online_exam_availability_notices.php'))->up();
    }

    protected function installExamDocumentSchema(): void
    {
        if (Schema::hasTable('admission_applications') && !Schema::hasColumn('admission_applications', 'academic_program_id')) {
            Schema::table('admission_applications', fn (Blueprint $t) => $t->unsignedBigInteger('academic_program_id')->default(1));
        }
        if (!Schema::hasTable('admission_requirements')) Schema::create('admission_requirements', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->boolean('is_required')->default(true); $t->boolean('is_active')->default(true);
        });
        if (!Schema::hasTable('admission_requirement_program')) Schema::create('admission_requirement_program', function (Blueprint $t) {
            $t->unsignedBigInteger('admission_requirement_id'); $t->unsignedBigInteger('academic_program_id');
        });
        if (!Schema::hasTable('application_documents')) Schema::create('application_documents', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('admission_application_id'); $t->string('document_name'); $t->string('status')->default('pending');
        });
    }
}
