<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationDocumentHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_document_id',
        'user_id',
        'action',
        'old_status',
        'new_status',
        'remarks',
    ];

    public function applicationDocument(): BelongsTo
    {
        return $this->belongsTo(
            ApplicationDocument::class,
            'application_document_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}