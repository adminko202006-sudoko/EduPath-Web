<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentVerification extends Model
{
    protected $guarded = ['id'];
    protected $hidden = ['school_id_path'];
    protected function casts(): array { return ['reviewed_at' => 'datetime', 'revision' => 'integer']; }
    public function applicant() { return $this->belongsTo(Applicant::class); }
    public function academicProgram() { return $this->belongsTo(AcademicProgram::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
}
