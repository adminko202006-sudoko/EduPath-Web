<?php

namespace Tests\Support;

use App\Models\StudentVerification;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

trait InstallsStudentVerificationSchema
{
    protected function installStudentVerificationSchema(): void
    {
        if (!Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', fn (Blueprint $t) => $t->timestamp('email_verified_at')->nullable());
        }
        if (!Schema::hasTable('academic_programs')) {
            Schema::create('academic_programs', function (Blueprint $t) { $t->id(); $t->string('name'); $t->boolean('is_active')->default(true); });
        }
        if (!Schema::hasTable('student_verifications')) {
            (require database_path('migrations/2026_10_26_100000_create_student_verification_tables.php'))->up();
        }
    }

    protected function studentIdentityInput(): array
    {
        return ['student_type' => 'new', 'lrn' => '123456789012', 'previous_school' => 'Test School',
            'school_id' => $this->schoolIdImage(),
            'address_components' => ['country_code' => 'PH', 'province_id' => '0701200000', 'city_id' => '0701244000', 'street' => 'Test Street']];
    }

    protected function verifiedStudent(User $user, string $type = 'new'): StudentVerification
    {
        $this->installStudentVerificationSchema();
        $user->forceFill(['email_verified_at' => now()])->save();
        $path = $this->schoolIdImage()->store('student-identities', 'local');
        return StudentVerification::create(['applicant_id' => $user->applicant->id, 'student_type' => $type,
            'lrn' => str_pad((string) $user->id, 12, '0', STR_PAD_LEFT), 'previous_school' => 'Test School',
            'school_id_path' => $path, 'status' => 'verified', 'revision' => 1]);
    }

    protected function schoolIdImage(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('school-id.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII='));
    }
}
