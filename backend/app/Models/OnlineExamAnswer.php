<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineExamAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'online_exam_attempt_id',
        'online_exam_question_id',
        'online_exam_option_id',
        'answered_at',
    ];

    protected function casts(): array
    {
        return [
            'answered_at' => 'datetime',
        ];
    }

    public function attempt()
    {
        return $this->belongsTo(
            OnlineExamAttempt::class,
            'online_exam_attempt_id'
        );
    }

    public function question()
    {
        return $this->belongsTo(
            OnlineExamQuestion::class,
            'online_exam_question_id'
        );
    }

    public function option()
    {
        return $this->belongsTo(
            OnlineExamOption::class,
            'online_exam_option_id'
        );
    }
}
