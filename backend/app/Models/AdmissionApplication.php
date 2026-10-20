<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'academic_program_id',
        'admission_period_id',
        'status',
        'remarks',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function academicProgram()
    {
        return $this->belongsTo(AcademicProgram::class);
    }

    public function admissionPeriod()
    {
        return $this->belongsTo(AdmissionPeriod::class);
    }

    public function documents()
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function histories()
    {
        return $this->hasMany(
            AdmissionApplicationHistory::class,
            'admission_application_id'
        )->latest();
    }
}
