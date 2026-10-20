<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Scholarship extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'provider',
        'program_type',
        'category',
        'requires_online_exam',
        'requires_face_to_face_exam',
        'description',
        'objectives',
        'goals',
        'target_beneficiaries',
        'eligibility',
        'requirements',
        'amount',
        'benefits',
        'covered_expenses',
        'application_start',
        'application_end',
        'application_start_at',
        'application_end_at',
        'available_slots',
        'unlimited_awards',
        'admission_approval_required',
        'exam_question_count',
        'exam_seconds_per_question',
        'exam_passing_score',
        'renewal_requirements',
        'official_reference',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'application_start' => 'date',
            'application_end' => 'date',
            'application_start_at' => 'datetime',
            'application_end_at' => 'datetime',
            'available_slots' => 'integer',
            'requires_online_exam' => 'boolean',
            'requires_face_to_face_exam' => 'boolean',
            'unlimited_awards' => 'boolean',
            'admission_approval_required' => 'boolean',
            'exam_question_count' => 'integer',
            'exam_seconds_per_question' => 'integer',
            'exam_passing_score' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function scholarshipApplications()
    {
        return $this->hasMany(ScholarshipApplication::class);
    }
}