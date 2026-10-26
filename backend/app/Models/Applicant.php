<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Applicant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'birth_date',
        'gender',
        'phone',
        'address',
        'profile_photo',
        'is_archived',
        'primary_school',
        'primary_school_year',
        'junior_high_school',
        'senior_high_school',
        'shs_strand',
        'lrn',
        'previous_college_university',
        'registration_details',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'is_archived' => 'boolean',
            'registration_details' => 'array',
        ];
    }
    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function admissionApplications()
    {
        return $this->hasMany(AdmissionApplication::class);
    }

    public function scholarshipApplications()
    {
        return $this->hasMany(ScholarshipApplication::class);
    }

    public function examAssignments()
    {
        return $this->hasMany(ExamAssignment::class);
    }
}
