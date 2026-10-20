<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntranceExam extends Model
{
    use HasFactory;

    public const QUESTION_COUNT = 100;
    public const MAXIMUM_SCORE = 100;
    public const PASSING_SCORE = 40;

    protected $hidden = ['roster_pdf_path'];
    protected $appends = ['has_roster_pdf', 'question_count', 'maximum_score', 'passing_score'];

    public function getHasRosterPdfAttribute(): bool { return !empty($this->attributes['roster_pdf_path']); }
    public function getQuestionCountAttribute(): int { return self::QUESTION_COUNT; }
    public function getMaximumScoreAttribute(): int { return self::MAXIMUM_SCORE; }
    public function getPassingScoreAttribute(): int { return self::PASSING_SCORE; }

    protected $fillable = [
        'title',
        'description',
        'exam_date',
        'start_time',
        'end_time',
        'venue',
        'capacity',
        'is_active',
        'results_released_at',
    ];

    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'is_active' => 'boolean',
            'results_released_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function examAssignments()
    {
        return $this->hasMany(ExamAssignment::class);
    }
}
