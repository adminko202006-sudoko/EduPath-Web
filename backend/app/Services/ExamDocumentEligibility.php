<?php

namespace App\Services;

use App\Models\AdmissionApplication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class ExamDocumentEligibility
{
    public const CODE = 'EXAM_DOCUMENT_VERIFICATION_REQUIRED';
    public const MESSAGE = 'All active required admission documents for your program must be uploaded and verified before you can take an examination. Open My Documents to check missing, pending, or rejected requirements.';

    public function admissions(bool $approvedOnly = false): Builder
    {
        // Requirements and uploads are linked by name in the existing schema.
        // Every requirement must be satisfied on the SAME admission application.
        return AdmissionApplication::query()
            ->whereIn('admission_applications.status', $approvedOnly ? ['approved'] : ['pending', 'under_review', 'approved'])
            ->whereNotExists(function ($requirements) {
                $requirements->selectRaw('1')->from('admission_requirements as exam_requirement')
                    ->join('admission_requirement_program as exam_program', 'exam_program.admission_requirement_id', '=', 'exam_requirement.id')
                    ->whereColumn('exam_program.academic_program_id', 'admission_applications.academic_program_id')
                    ->where('exam_requirement.is_active', true)->where('exam_requirement.is_required', true)
                    ->whereNotExists(function ($documents) {
                        $documents->selectRaw('1')->from('application_documents as exam_document')
                            ->whereColumn('exam_document.admission_application_id', 'admission_applications.id')
                            ->whereRaw('LOWER(TRIM(exam_document.document_name)) = LOWER(TRIM(exam_requirement.name))')
                            ->where('exam_document.status', 'verified');
                    });
            });
    }

    public function eligible(int $applicantId, bool $approvedOnly = false): bool
    {
        return $this->admissions($approvedOnly)->where('applicant_id', $applicantId)->exists();
    }

    public function constrainApplicants(Builder $query): Builder
    {
        return $query->whereIn('applicants.id', $this->admissions()->select('admission_applications.applicant_id'));
    }

    public function ensureEligible(int $applicantId): void
    {
        if (!$this->eligible($applicantId)) {
            throw ValidationException::withMessages(['applicant_ids' => self::MESSAGE]);
        }
    }
}
