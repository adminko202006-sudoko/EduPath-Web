<?php

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueAccountEmail implements ValidationRule
{
    public const MESSAGE = 'This email address is already used by another account. Please use a different email or sign in.';

    public function __construct(private readonly ?int $ignoreUserId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            $fail('Please enter a valid email address.');
            return;
        }
        $query = User::whereRaw('LOWER(TRIM(email)) = ?', [User::normalizeEmail($value)]);
        if ($this->ignoreUserId !== null) $query->where('id', '<>', $this->ignoreUserId);
        if ($query->exists()) $fail(self::MESSAGE);
    }
}
