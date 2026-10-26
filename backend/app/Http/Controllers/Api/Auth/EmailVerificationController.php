<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class EmailVerificationController extends Controller
{
    public function send(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if ($user->email_verified_at) return response()->json(['message' => 'Your email is already verified.']);
            $previous = DB::table('email_verification_codes')->where('user_id', $user->id)->first();
            abort_if($previous && now()->diffInSeconds(\Carbon\Carbon::parse($previous->sent_at), true) < 60,
                429, 'Please wait 60 seconds before requesting another code.');
            // A log/array/failover-to-log mailer is not successful email delivery.
            $transport = config('mail.mailers.'.config('mail.default').'.transport');
            abort_unless(app()->environment('testing') || in_array($transport, ['smtp', 'sendmail', 'ses', 'postmark', 'resend', 'mailgun'], true),
                503, 'Email delivery is not configured. Please contact the college.');
            $code = (string) random_int(100000, 999999);
            DB::table('email_verification_codes')->updateOrInsert(['user_id' => $user->id], [
                'email' => $user->email, 'code_hash' => Hash::make($code), 'attempts' => 0,
                'expires_at' => now()->addMinutes(10), 'sent_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
            // Synchronous delivery failures roll back the challenge; no false "sent" response.
            $user->notify(new EmailVerificationCodeNotification($code));
            return response()->json(['message' => 'Verification code sent. Check your email, including spam.', 'expires_in' => 600, 'resend_after' => 60]);
        });
    }

    public function verify(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'string', 'regex:/^[0-9]{6}$/D']]);
        $verified = DB::transaction(function () use ($request, $data) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if ($user->email_verified_at) return true;
            $row = DB::table('email_verification_codes')->where('user_id', $user->id)->first();
            if (!$row || $row->email !== $user->email || $row->attempts >= 5 || now()->gte($row->expires_at)) return false;
            DB::table('email_verification_codes')->where('id', $row->id)->increment('attempts');
            if (!Hash::check($data['code'], $row->code_hash)) return false;
            $user->forceFill(['email_verified_at' => now()])->save();
            DB::table('email_verification_codes')->where('id', $row->id)->delete();
            return true;
        });
        // Throw after committing, so failed guesses consume the attempt budget.
        if (!$verified) throw ValidationException::withMessages(['code' => ['The code is incorrect, expired, or has too many failed attempts. Request a new code when available.']]);
        return response()->json(['message' => 'Email verified successfully.']);
    }
}
