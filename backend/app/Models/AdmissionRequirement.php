<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AdmissionRequirement extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'file_path',
        'is_required',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function academicPrograms(): BelongsToMany
    {
        return $this->belongsToMany(
            AcademicProgram::class,
            'admission_requirement_program',
            'admission_requirement_id',
            'academic_program_id'
        )->withTimestamps();
    }
}