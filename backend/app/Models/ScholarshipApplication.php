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

    protected $fillable = [
        'applicant_id',
        'scholarship_id',
        'status',
        'remarks',
        'submitted_at',
        'staff_recommendation',
        'staff_recommendation_remarks',
        'staff_recommended_by',
        'staff_recommended_at',
    ];

    protected function casts(): array
    {
        return [
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

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
