<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'entrance_exam_id',
        'applicant_id',
        'status',
        'score',
        'remarks',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function entranceExam()
    {
        return $this->belongsTo(EntranceExam::class);
    }

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }
}