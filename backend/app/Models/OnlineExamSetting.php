<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnlineExamSetting extends Model
{
    public const DEFAULT_SECONDS = 60;
    public const MAX_SECONDS = 3600;
    public const DEFAULT_QUESTION_COUNT = 100;
    public const MAX_QUESTION_COUNT = 500;

    protected $fillable = ['seconds_per_question', 'required_question_count', 'updated_by'];

    public static function requiredQuestionCount(): int
    {
        return (int) (static::whereKey(1)->value('required_question_count') ?? self::DEFAULT_QUESTION_COUNT);
    }

    public static function secondsPerQuestion(): int
    {
        return (int) (static::whereKey(1)->value('seconds_per_question') ?? self::DEFAULT_SECONDS);
    }
}
