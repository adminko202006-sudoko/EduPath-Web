<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntranceExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'exam_date',
        'start_time',
        'end_time',
        'venue',
        'capacity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'is_active' => 'boolean',
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