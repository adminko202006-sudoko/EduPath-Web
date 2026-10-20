<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An administrator-approved retake for the Online Examination.
 *
 * There is deliberately no applicant-facing route that creates these rows, so
 * a mobile client can never grant itself an extra attempt.
 */
class OnlineExamRetakeGrant extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'reason',
        'granted_by',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }
}
