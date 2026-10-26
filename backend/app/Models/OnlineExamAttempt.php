<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineExamAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'status',
        'question_count',
        'seconds_per_question',
        'review_cutoff_seconds',
        'started_at',
        'expires_at',
        'completed_at',
        'current_question_index',
        'navigation_mode',
        'viewed_question_index',
        'navigation_revision',
        'score',
        'passed',
        'results_released_by',
        'remarks',
        'results_released_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'completed_at' => 'datetime',
            'results_released_at' => 'datetime',
            'score' => 'decimal:2',
            'passed' => 'boolean',
            'question_count' => 'integer',
            'seconds_per_question' => 'integer',
            'review_cutoff_seconds' => 'integer',
            'current_question_index' => 'integer',
            'navigation_mode' => 'integer',
            'viewed_question_index' => 'integer',
            'navigation_revision' => 'integer',
        ];
    }

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function assignedQuestions()
    {
        return $this->belongsToMany(OnlineExamQuestion::class, 'online_exam_attempt_questions', 'online_exam_attempt_id', 'online_exam_question_id')
            ->withPivot('position')
            ->orderBy('online_exam_attempt_questions.position');
    }

    public function answers()
    {
        return $this->hasMany(
            OnlineExamAnswer::class,
            'online_exam_attempt_id'
        );
    }

    public function reviews()
    {
        return $this->hasMany(OnlineExamReview::class)->with('reviewer')->latest('updated_at');
    }
}
