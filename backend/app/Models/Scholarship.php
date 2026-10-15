<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Scholarship extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'provider',
        'program_type',
        'description',
        'objectives',
        'goals',
        'target_beneficiaries',
        'eligibility',
        'requirements',
        'amount',
        'benefits',
        'covered_expenses',
        'application_start',
        'application_end',
        'available_slots',
        'renewal_requirements',
        'official_reference',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'application_start' => 'date',
            'application_end' => 'date',
            'available_slots' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function scholarshipApplications()
    {
        return $this->hasMany(ScholarshipApplication::class);
    }
}