<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnlineExamReview extends Model
{
    protected $fillable = ['online_exam_attempt_id', 'reviewed_by', 'recommendation', 'remarks'];

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by')->select(['id', 'name']);
    }
}
