<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken;

class OnlinePresence
{
    public const TTL_SECONDS = 90;

    private function key(int $tokenId): string
    {
        return 'edupath:presence:token:'.$tokenId;
    }

    public function touch(PersonalAccessToken $token): void
    {
        Cache::put($this->key($token->id), true, self::TTL_SECONDS);
    }

    /** A valid, recently heartbeating token on any device means recently online. */
    public function statuses(array $userIds): array
    {
        $result = array_fill_keys(array_map('strval', $userIds), false);
        $eligible = User::whereIn('id', $userIds)->where(function ($query) {
            $query->where('role', 'applicant')->orWhere(function ($staff) {
                $staff->where('role', 'staff')->whereHas('staff', fn ($profile) => $profile->where('status', 'active'));
            });
        })->pluck('id');
        $tokens = PersonalAccessToken::where('tokenable_type', (new User)->getMorphClass())
            ->whereIn('tokenable_id', $eligible)
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->get(['id', 'tokenable_id', 'created_at']);
        $expiration = config('sanctum.expiration');
        $cache = Cache::many($tokens->map(fn ($token) => $this->key($token->id))->all());
        foreach ($tokens as $token) {
            if ($expiration && $token->created_at->lte(now()->subMinutes($expiration))) continue;
            if ($cache[$this->key($token->id)] ?? false) $result[(string) $token->tokenable_id] = true;
        }

        return $result;
    }
}
