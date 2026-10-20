<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AcademicProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function admissionApplications()
    {
        return $this->hasMany(AdmissionApplication::class);
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(
            Staff::class,
            'staff_programs',
            'academic_program_id',
            'staff_id'
        )->withTimestamps();
    }

    public function admissionRequirements(): BelongsToMany
    {
        return $this->belongsToMany(
            AdmissionRequirement::class,
            'admission_requirement_program',
            'academic_program_id',
            'admission_requirement_id'
        )->withTimestamps();
    }
}
