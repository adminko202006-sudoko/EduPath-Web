<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id',
        'manage_admissions',
        'verify_documents',
        'manage_exams',
        'manage_scholarships',
        'manage_announcements',
        'send_notifications',
        'view_reports',
    ];

    protected function casts(): array
    {
        return [
            'manage_admissions' => 'boolean',
            'verify_documents' => 'boolean',
            'manage_exams' => 'boolean',
            'manage_scholarships' => 'boolean',
            'manage_announcements' => 'boolean',
            'send_notifications' => 'boolean',
            'view_reports' => 'boolean',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}
