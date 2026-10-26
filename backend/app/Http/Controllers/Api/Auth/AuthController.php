<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Applicant;
use App\Models\PasswordResetOtp;
use App\Notifications\PasswordResetOtpNotification;
use App\Notifications\PasswordChangedNotification;
use App\Rules\UniqueAccountEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register a new applicant.
     */
    public function register(Request $request)
    {
        $requiresOldStudentDetails = $request->has('registration_details')
            && $request->input('student_type') === 'old';
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'required|date|before_or_equal:today',
            'gender' => 'required|string|in:Male,Female,Other',
            'phone' => 'required|string|max:30',
            'address' => 'nullable|string|max:500',
            'address_components' => 'required|array:country_code,province_id,city_id,province,city,street',
            'address_components.country_code' => 'required|in:PH',
            'address_components.province_id' => 'nullable|string|max:20',
            'address_components.city_id' => 'nullable|string|max:20',
            'address_components.province' => 'nullable|string|max:150',
            'address_components.city' => 'nullable|string|max:150',
            'address_components.street' => 'required_with:address_components|string|max:200',
            'email' => ['bail', 'required', 'email', 'max:255', new UniqueAccountEmail()],
            'password' => 'required|string|min:8|confirmed',
            // Optional for existing web clients; complete when submitted by mobile.
            'registration_details' => 'sometimes|required|array:course_code,year_level,has_existing_scholarship,existing_scholarship_name',
            'registration_details.course_code' => [
                'exclude_unless:student_type,old', Rule::requiredIf($requiresOldStudentDetails),
                'nullable', Rule::in(['BSIT', 'BSOA', 'BSCrim', 'BSPolSci', 'CAS', 'BSED']),
            ],
            'registration_details.year_level' => [
                'exclude_unless:student_type,old', Rule::requiredIf($requiresOldStudentDetails),
                'nullable', 'integer', 'between:1,4',
            ],
            'registration_details.has_existing_scholarship' => 'required_with:registration_details|boolean',
            'registration_details.existing_scholarship_name' => [
                Rule::requiredIf($request->boolean('registration_details.has_existing_scholarship')),
                'nullable', 'string', 'max:255',
            ],
        ]);

        if (isset($validated['registration_details'])) {
            $details = &$validated['registration_details'];
            $details['has_existing_scholarship'] = (bool) $details['has_existing_scholarship'];
            $details['existing_scholarship_name'] = $details['has_existing_scholarship']
                ? trim($details['existing_scholarship_name']) : null;
            if (isset($details['year_level'])) $details['year_level'] = (int) $details['year_level'];
            unset($details);
        }

        if (isset($validated['address_components'])) {
            $validated['address'] = app(\App\Services\LocationCatalog::class)->address($validated['address_components']);
        }

        $fullName = implode(' ', array_filter([
            $validated['first_name'],
            $validated['middle_name'] ?? null,
            $validated['last_name'],
        ]));

        if (mb_strlen($fullName) > 255) {
            throw ValidationException::withMessages([
                'first_name' => ['Your combined first, middle and last name must not exceed 255 characters.'],
            ]);
        }

        $identities = app(\App\Services\StudentVerificationService::class);
        $identity = $identities->validate($request);
        $schoolIdPath = $request->file('school_id')->store('student-identities', 'local');
        abort_unless($schoolIdPath, 503, 'Your school ID could not be stored. Please try again.');
        try {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $fullName, $identities, $identity, $schoolIdPath) {
            $user = User::create([
                'name' => $fullName,
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'applicant',
            ]);

            $applicant = Applicant::create([
                'user_id' => $user->id,
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'birth_date' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                // Self-reported information does not confirm a program or award.
                ...(isset($validated['registration_details'])
                    ? ['registration_details' => $validated['registration_details']] : []),
            ]);

            $identities->submit($applicant, $identity, $schoolIdPath, $user);
            \App\Models\UserOnboardingState::enrollNewApplicant($user);
            $token = $user->createToken('edupath-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Account created. Verify your email and wait for administrator identity review before applying.',
                'user' => $user->load('applicant'),
                'token' => $token,
            ], 201);
        });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($schoolIdPath);
            throw $error;
        }
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

        if ($user->role === 'admin') {
            $user->setAttribute(
                'profile_photo_url',
                $user->profile_photo ? Storage::disk('public')->url($user->profile_photo) : null
            );
        }

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
     * Existing applicants, administrators and staff can recover their password.
     * Recovery never changes roles, staff permissions or activation status.
     */
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])->first();

        /*
        |--------------------------------------------------------------------------
        | Do not reveal whether the email exists.
        |--------------------------------------------------------------------------
        */
        if (
            !$user ||
            !in_array($user->role, ['applicant', 'admin', 'staff'], true)
        ) {
            return response()->json([
                'success' => true,
                'message' => 'If an account exists with this email, a verification code has been sent.',
            ]);
        }

        // Resends and verification/reset serialize on the same account lock.
        $otp = (string) random_int(100000, 999999);
        \Illuminate\Support\Facades\DB::transaction(function () use ($user, $email, $otp) {
            $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if (strtolower(trim($user->email)) !== $email || !in_array($user->role, ['applicant', 'admin', 'staff'], true)) return;
            PasswordResetOtp::where('user_id', $user->id)->delete();


            PasswordResetOtp::create([
                'user_id' => $user->id,
                'email' => $email,
                'otp_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes(10),
                'attempts' => 0,
                'verified_at' => null,
            ]);

            // Preserve the previous credential if the mail transport fails.
            // No successful response is returned for a failed delivery request.
            $user->notify(new PasswordResetOtpNotification($otp));
        });

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
        $validated = $request->validate(['email' => 'required|email', 'otp' => 'required|digits:6']);
        $email = strtolower(trim($validated['email']));
        $result = \Illuminate\Support\Facades\DB::transaction(function () use ($email, $validated) {
            $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])->lockForUpdate()->first();
            if (!$user || !in_array($user->role, ['applicant', 'admin', 'staff'], true)) return null;
            $otp = PasswordResetOtp::where('user_id', $user->id)->where('email', $email)->latest('id')->lockForUpdate()->first();
            if (!$otp || $otp->verified_at || $otp->expires_at->isPast() || $otp->attempts >= 5) return null;
            if (!Hash::check($validated['otp'], $otp->otp_hash)) {
                $otp->increment('attempts');
                return null;
            }
            $token = Str::random(64);
            $otp->update(['verified_at' => now(), 'reset_token_hash' => hash('sha256', $token)]);
            return $token;
        });
        if (!$result) throw ValidationException::withMessages(['otp' => ['The verification code is invalid, expired, or already used. Please request a new code if needed.']]);
        return response()->json(['success' => true, 'message' => 'Verification code verified successfully.', 'reset_token' => $result]);
    }

    public function resetPasswordWithOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
            'reset_token' => 'required|string|size:64',
        ]);
        $email = strtolower(trim($validated['email']));
        $changed = \Illuminate\Support\Facades\DB::transaction(function () use ($email, $validated) {
            $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])->lockForUpdate()->first();
            if (!$user || !in_array($user->role, ['applicant', 'admin', 'staff'], true)) return false;
            $otp = PasswordResetOtp::where('user_id', $user->id)->where('email', $email)->latest('id')->lockForUpdate()->first();
            if (!$otp || !$otp->verified_at || $otp->verified_at->copy()->addMinutes(10)->isPast()
                || !$otp->reset_token_hash || !hash_equals($otp->reset_token_hash, hash('sha256', $validated['reset_token']))) return false;
            $this->completePasswordReset($user, $validated['password']);
            return true;
        });
        if (!$changed) throw ValidationException::withMessages(['reset_token' => ['The password reset session is invalid or expired. Please request a new code.']]);
        return response()->json(['success' => true, 'message' => 'Password reset successfully.']);
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

        $email = strtolower(trim($validated['email']));
        $status = \Illuminate\Support\Facades\DB::transaction(function () use ($email, $validated) {
            $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])->lockForUpdate()->first();
            if (!$user || !in_array($user->role, ['applicant', 'admin', 'staff'], true)) return Password::INVALID_USER;
            return Password::reset(
                [
                    'email' => $user->email,
                    'password' => $validated['password'],
                    'password_confirmation' => $validated['password_confirmation'] ?? $validated['password'],
                    'token' => $validated['token'],
                ],
                fn ($account, $password) => $this->completePasswordReset($account, $password)
            );
        });

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

    /** Both recovery methods revoke existing credentials and notify the owner. */
    private function completePasswordReset(User $user, string $password): void
    {
        $user->forceFill([
            'password' => Hash::make($password),
            'remember_token' => Str::random(60),
        ])->save();
        $user->tokens()->delete();
        if (config('session.driver') === 'database') {
            \Illuminate\Support\Facades\DB::connection(config('session.connection'))
                ->table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
        PasswordResetOtp::where('user_id', $user->id)->delete();
        Password::deleteToken($user);

        // Synchronous mail inside the transaction: a transport failure rolls
        // back the password/session changes and leaves recovery usable for retry.
        $user->notify(new PasswordChangedNotification());
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

        $photo = $user->role === 'applicant' ? $user->applicant?->profile_photo : $user->profile_photo;
        $user->setAttribute('profile_photo_url', $photo ? Storage::disk('public')->url($photo) : null);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }
}
