<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_id',
        'staff_role',
        'first_name',
        'middle_name',
        'last_name',
        'position',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function permissions()
    {
        return $this->hasOne(StaffPermission::class);
    }

    public function academicPrograms()
    {
        return $this->belongsToMany(
            AcademicProgram::class,
            'staff_programs'
        );
    }
}