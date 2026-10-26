<?php

namespace App\Models;

use App\Models\Applicant;
use App\Models\Scholarship;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipApplication extends Model
{
    use HasFactory;

    protected $hidden = ['supporting_document_path', 'requirement_documents'];
    protected $appends = ['submitted_requirements'];

    protected $fillable = [
        'applicant_id',
        'scholarship_id',
        'status',
        'remarks',
        'submitted_at',
        'application_details',
        'requirement_documents',
        'supporting_document_path',
        'supporting_document_name',
        'staff_recommendation',
        'staff_recommendation_remarks',
        'staff_recommended_by',
        'staff_recommended_at',
    ];

    protected function casts(): array
    {
        return [
            'requirement_documents' => 'array',
            'application_details' => 'array',
            'submitted_at' => 'datetime',
            'staff_recommended_at' => 'datetime',
            'award_decided_at' => 'datetime',
            'award_revision' => 'integer',
        ];
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(Applicant::class);
    }

    public function getSubmittedRequirementsAttribute(): array
    {
        return array_map(fn ($document, $index) => [
            'index' => $index, 'requirement' => $document['requirement'], 'name' => $document['name'],
        ], $this->requirement_documents ?? [], array_keys($this->requirement_documents ?? []));
    }

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
