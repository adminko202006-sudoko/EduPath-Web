<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineExamOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'online_exam_question_id',
        'text',
        'is_correct',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
        ];
    }

    public function question()
    {
        return $this->belongsTo(OnlineExamQuestion::class, 'online_exam_question_id');
    }
}
