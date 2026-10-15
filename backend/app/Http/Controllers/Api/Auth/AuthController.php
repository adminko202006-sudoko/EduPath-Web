<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Applicant;
use App\Models\PasswordResetOtp;
use App\Notifications\PasswordResetOtpNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new applicant.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'gender' => 'required|string|in:Male,Female,Other',
            'phone' => 'required|string|max:30',
            'address' => 'required|string|max:500',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $fullName = implode(' ', array_filter([
            $validated['first_name'],
            $validated['middle_name'] ?? null,
            $validated['last_name'],
        ]));

        $user = User::create([
            'name' => $fullName,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'applicant',
        ]);

        Applicant::create([
            'user_id' => $user->id,
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'birth_date' => $validated['birth_date'],
            'gender' => $validated['gender'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
        ]);

        $token = $user->createToken('edupath-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'user' => $user->load('applicant'),
            'token' => $token,
        ], 201);
    }

    /**
     * Login user.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])->first();

        /*
        |--------------------------------------------------------------------------
        | Validate credentials.
        |--------------------------------------------------------------------------
        */
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Staff account status check.
        |--------------------------------------------------------------------------
        |
        | Staff accounts are controlled by the administrator through the
        | staff.status field. Inactive staff members must not receive an
        | authentication token.
        |--------------------------------------------------------------------------
        */
        if ($user->role === 'staff') {
            $user->load('staff');

            if (!$user->staff) {
                throw ValidationException::withMessages([
                    'email' => ['Staff profile not found. Please contact the administrator.'],
                ]);
            }

            if ($user->staff->status !== 'active') {
                throw ValidationException::withMessages([
                    'email' => ['Your staff account is inactive. Please contact the administrator.'],
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Load role-specific relationships.
        |--------------------------------------------------------------------------
        */
        $user->load([
            'staff.permissions',
            'staff.academicPrograms',
            'applicant',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Create authentication token.
        |--------------------------------------------------------------------------
        */
        $token = $user->createToken('edupath-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Change authenticated user's password.
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $validated['new_password'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    /**
     * Send password reset OTP.
     *
     * Only applicants and admins can use self-service
     * password recovery. Staff accounts are managed by admins.
     */
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::where('email', $email)->first();

        /*
        |--------------------------------------------------------------------------
        | Do not reveal whether the email exists.
        |--------------------------------------------------------------------------
        */
        if (
            !$user ||
            !in_array($user->role, ['applicant', 'admin'], true)
        ) {
            return response()->json([
                'success' => true,
                'message' => 'If an account exists with this email, a verification code has been sent.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Delete previous OTPs for this user.
        |--------------------------------------------------------------------------
        */
        PasswordResetOtp::where('user_id', $user->id)->delete();

        /*
        |--------------------------------------------------------------------------
        | Generate a secure 6-digit OTP.
        |--------------------------------------------------------------------------
        */
        $otp = (string) random_int(100000, 999999);

        /*
        |--------------------------------------------------------------------------
        | Store only the hashed OTP.
        |--------------------------------------------------------------------------
        */
        PasswordResetOtp::create([
            'user_id' => $user->id,
            'email' => $email,
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'verified_at' => null,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Send the OTP to the user's email.
        |--------------------------------------------------------------------------
        */
        $user->notify(
            new PasswordResetOtpNotification($otp)
        );

        return response()->json([
            'success' => true,
            'message' => 'If an account exists with this email, a verification code has been sent.',
        ]);
    }

    /**
     * Verify password reset OTP.
     */
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::where('email', $email)->first();

        /*
        |--------------------------------------------------------------------------
        | Only applicants and admins can verify password reset OTPs.
        |--------------------------------------------------------------------------
        */
        if (
            !$user ||
            !in_array($user->role, ['applicant', 'admin'], true)
        ) {
            throw ValidationException::withMessages([
                'otp' => ['The verification code is invalid or expired.'],
            ]);
        }

        $otpRecord = PasswordResetOtp::where('user_id', $user->id)
            ->where('email', $email)
            ->latest()
            ->first();

        /*
        |--------------------------------------------------------------------------
        | OTP does not exist.
        |--------------------------------------------------------------------------
        */
        if (!$otpRecord) {
            throw ValidationException::withMessages([
                'otp' => ['The verification code is invalid or expired.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | OTP already verified.
        |--------------------------------------------------------------------------
        */
        if ($otpRecord->verified_at) {
            throw ValidationException::withMessages([
                'otp' => ['This verification code has already been used.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | OTP expired.
        |--------------------------------------------------------------------------
        */
        if ($otpRecord->expires_at->isPast()) {
            $otpRecord->delete();

            throw ValidationException::withMessages([
                'otp' => ['The verification code has expired. Please request a new code.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Maximum verification attempts.
        |--------------------------------------------------------------------------
        */
        if ($otpRecord->attempts >= 5) {
            $otpRecord->delete();

            throw ValidationException::withMessages([
                'otp' => ['Too many incorrect attempts. Please request a new code.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Check OTP.
        |--------------------------------------------------------------------------
        */
        if (!Hash::check($validated['otp'], $otpRecord->otp_hash)) {
            $otpRecord->increment('attempts');

            throw ValidationException::withMessages([
                'otp' => ['The verification code is incorrect.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | OTP is correct.
        |--------------------------------------------------------------------------
        */
        $otpRecord->update([
            'verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification code verified successfully.',
        ]);
    }

    /**
     * Reset password using a verified OTP.
     */
    public function resetPasswordWithOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::where('email', $email)->first();

        /*
        |--------------------------------------------------------------------------
        | Only applicants and admins can use OTP password reset.
        |--------------------------------------------------------------------------
        */
        if (
            !$user ||
            !in_array($user->role, ['applicant', 'admin'], true)
        ) {
            throw ValidationException::withMessages([
                'email' => ['The password reset request is invalid.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Find the latest OTP for this user.
        |--------------------------------------------------------------------------
        */
        $otpRecord = PasswordResetOtp::where('user_id', $user->id)
            ->where('email', $email)
            ->latest()
            ->first();

        /*
        |--------------------------------------------------------------------------
        | OTP must exist.
        |--------------------------------------------------------------------------
        */
        if (!$otpRecord) {
            throw ValidationException::withMessages([
                'email' => ['The password reset request is invalid or expired.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | OTP must have been successfully verified.
        |--------------------------------------------------------------------------
        */
        if (!$otpRecord->verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Please verify the OTP before changing your password.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Verification must not be too old.
        |--------------------------------------------------------------------------
        |
        | This gives the user 10 minutes to complete the
        | password change after verifying the OTP.
        |--------------------------------------------------------------------------
        */
        if ($otpRecord->verified_at->addMinutes(10)->isPast()) {
            $otpRecord->delete();

            throw ValidationException::withMessages([
                'email' => ['The password reset session has expired. Please request a new OTP.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Update the password.
        |--------------------------------------------------------------------------
        */
        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'remember_token' => Str::random(60),
        ])->save();

        /*
        |--------------------------------------------------------------------------
        | Delete the OTP so it cannot be reused.
        |--------------------------------------------------------------------------
        */
        $otpRecord->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }

    /**
     * Reset user's password.
     *
     * TEMPORARY:
     * This old reset-link method will be replaced by the
     * OTP verification/password reset process.
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            [
                'email' => $validated['email'],
                'password' => $validated['password'],
                'password_confirmation' => $request->password_confirmation,
                'token' => $validated['token'],
            ],
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful.',
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function user(Request $request)
    {
        $user = $request->user();

        $user->load([
            'staff.permissions',
            'staff.academicPrograms',
            'applicant',
        ]);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }
}
