<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_application_id',
        'document_name',
        'file_path',
        'file_type',
        'status',
        'remarks',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function admissionApplication()
    {
        return $this->belongsTo(AdmissionApplication::class);
    }

    public function histories()
    {
        return $this->hasMany(
            ApplicationDocumentHistory::class,
            'application_document_id'
        )->latest();
    }
}