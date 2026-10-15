<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdmissionApplicationHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_application_id',
        'user_id',
        'action',
        'old_status',
        'new_status',
        'remarks',
    ];

    public function admissionApplication(): BelongsTo
    {
        return $this->belongsTo(
            AdmissionApplication::class,
            'admission_application_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}