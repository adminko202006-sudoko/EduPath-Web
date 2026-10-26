<?php

namespace Tests\Feature;

use App\Services\ExamDocumentEligibility;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ExamDocumentEligibilityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        Schema::create('admission_applications', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('applicant_id'); $t->unsignedBigInteger('academic_program_id'); $t->string('status');
        });
        Schema::create('admission_requirements', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->boolean('is_active'); $t->boolean('is_required');
        });
        Schema::create('admission_requirement_program', function (Blueprint $t) {
            $t->unsignedBigInteger('admission_requirement_id'); $t->unsignedBigInteger('academic_program_id');
        });
        Schema::create('application_documents', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('admission_application_id'); $t->string('document_name'); $t->string('status');
        });
        DB::table('admission_applications')->insert(['id' => 1, 'applicant_id' => 1, 'academic_program_id' => 1, 'status' => 'approved']);
    }

    private function requirement(int $id, string $name, bool $required = true, bool $active = true, int $program = 1): void
    {
        DB::table('admission_requirements')->insert(['id' => $id, 'name' => $name, 'is_required' => $required, 'is_active' => $active]);
        DB::table('admission_requirement_program')->insert(['admission_requirement_id' => $id, 'academic_program_id' => $program]);
    }

    public function test_missing_pending_and_rejected_requirements_block_but_verified_name_matches_ignore_case_and_edge_spaces(): void
    {
        $this->requirement(1, 'Academic record');
        $eligibility = app(ExamDocumentEligibility::class);
        $this->assertFalse($eligibility->eligible(1));
        $id = DB::table('application_documents')->insertGetId(['admission_application_id' => 1, 'document_name' => '  ACADEMIC RECORD  ', 'status' => 'pending']);
        foreach (['pending', 'rejected', 'under_review'] as $status) {
            DB::table('application_documents')->where('id', $id)->update(['status' => $status]);
            $this->assertFalse($eligibility->eligible(1));
        }
        DB::table('application_documents')->where('id', $id)->update(['status' => 'verified']);
        $this->assertTrue($eligibility->eligible(1));
    }

    public function test_optional_inactive_and_other_program_requirements_do_not_block(): void
    {
        $this->requirement(1, 'Optional document', false);
        $this->requirement(2, 'Inactive document', true, false);
        $this->requirement(3, 'Other program document', true, true, 2);
        DB::table('application_documents')->insert(['admission_application_id' => 1, 'document_name' => 'Optional document', 'status' => 'rejected']);
        $this->assertTrue(app(ExamDocumentEligibility::class)->eligible(1, true));
    }

    public function test_documents_cannot_be_borrowed_from_another_applicant_or_split_across_applications(): void
    {
        $this->requirement(1, 'Academic record'); $this->requirement(2, 'Birth certificate');
        DB::table('admission_applications')->insert([
            ['id' => 2, 'applicant_id' => 1, 'academic_program_id' => 1, 'status' => 'approved'],
            ['id' => 3, 'applicant_id' => 2, 'academic_program_id' => 1, 'status' => 'approved'],
        ]);
        DB::table('application_documents')->insert([
            ['admission_application_id' => 1, 'document_name' => 'Academic record', 'status' => 'verified'],
            ['admission_application_id' => 2, 'document_name' => 'Birth certificate', 'status' => 'verified'],
            ['admission_application_id' => 3, 'document_name' => 'Academic record', 'status' => 'verified'],
            ['admission_application_id' => 3, 'document_name' => 'Birth certificate', 'status' => 'verified'],
        ]);
        $this->assertFalse(app(ExamDocumentEligibility::class)->eligible(1));
        $this->assertTrue(app(ExamDocumentEligibility::class)->eligible(2));
        DB::table('application_documents')->insert(['admission_application_id' => 1, 'document_name' => 'Birth certificate', 'status' => 'verified']);
        $this->assertTrue(app(ExamDocumentEligibility::class)->eligible(1));
    }

    public function test_no_admission_and_closed_applications_fail_while_online_retains_approved_admission_rule(): void
    {
        $eligibility = app(ExamDocumentEligibility::class);
        $this->assertFalse($eligibility->eligible(999));
        foreach (['rejected', 'withdrawn'] as $status) {
            DB::table('admission_applications')->where('id', 1)->update(['status' => $status]);
            $this->assertFalse($eligibility->eligible(1));
        }
        foreach (['pending', 'under_review'] as $status) {
            DB::table('admission_applications')->where('id', 1)->update(['status' => $status]);
            $this->assertTrue($eligibility->eligible(1));
            $this->assertFalse($eligibility->eligible(1, true));
        }
        DB::table('admission_applications')->where('id', 1)->update(['status' => 'approved']);
        $this->assertTrue($eligibility->eligible(1, true));
    }
}
