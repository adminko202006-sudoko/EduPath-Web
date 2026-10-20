<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $appends = ['destination'];

    public function getDestinationAttribute(): ?string
    {
        // Includes existing notifications: no data rewrite or enum change is required.
        $content = strtolower($this->title . ' ' . $this->message);
        if ($this->type === 'exam' && preg_match('/online (?:scholarship )?exam/', $content)) {
            return 'online_exam';
        }
        return $this->type === 'exam' ? 'scheduled_exam' : null;
    }

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'announcement_id',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }
}
