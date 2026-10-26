<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An online examination question.
 *
 * The related options carry the answer key (`is_correct`); applicants must
 * never receive that field, so controllers select explicit columns.
 */
class OnlineExamQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'is_active',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function attempts()
    {
        return $this->belongsToMany(OnlineExamAttempt::class, 'online_exam_attempt_questions', 'online_exam_question_id', 'online_exam_attempt_id')
            ->withPivot('position');
    }

    public function options()
    {
        return $this->hasMany(OnlineExamOption::class, 'online_exam_question_id')
            ->orderBy('position')
            ->orderBy('id');
    }

    public function scopeEligible(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('is_active', true)->whereRaw("TRIM(question) <> ''")
            ->has('options', '>=', 2)->has('options', '<=', 6)
            ->whereHas('options', fn ($options) => $options->where('is_correct', true), '=', 1)
            ->whereDoesntHave('options', fn ($options) => $options->whereRaw("TRIM(text) = ''"));
    }
}
