<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'academic_year',
        'admission_type',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function admissionApplications()
    {
        return $this->hasMany(AdmissionApplication::class);
    }
}
