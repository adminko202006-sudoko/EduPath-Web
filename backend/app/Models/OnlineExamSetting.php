<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnlineExamSetting extends Model
{
    public const DEFAULT_SECONDS = 60;
    public const MAX_SECONDS = 3600;

    protected $fillable = ['seconds_per_question', 'updated_by'];

    public static function secondsPerQuestion(): int
    {
        return (int) (static::whereKey(1)->value('seconds_per_question') ?? self::DEFAULT_SECONDS);
    }
}
