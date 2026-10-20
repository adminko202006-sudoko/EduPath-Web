<?php

namespace App\Services;

use App\Models\EntranceExam;
use App\Models\User;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class EntranceExamRosterService
{
    public static function uploadRules(): array
    {
        return ['nullable', 'file', 'mimes:pdf', 'extensions:pdf', 'max:10240'];
    }

    /** Caller holds the parent exam lock. Retain previous versions for audit history. */
    public function upload(EntranceExam $exam, UploadedFile $file, User $actor): void
    {
        if (file_get_contents($file->getRealPath(), false, null, 0, 5) !== '%PDF-') {
            throw ValidationException::withMessages(['roster_pdf' => 'Upload a valid PDF roster.']);
        }
        $path = Storage::disk('local')->putFile('entrance-exam-rosters/'.$exam->id, $file);
        if (!$path) throw new \RuntimeException('The roster PDF could not be stored.');
        try {
            $old = $exam->has_roster_pdf;
            $exam->forceFill(['roster_pdf_path' => $path])->save();
            app(WorkflowDecisionService::class)->event('scheduled_exam', $exam->id, 'roster_uploaded',
                $old ? 'uploaded' : null, 'uploaded', 'Private PDF roster version: '.basename($path), $actor);
        } catch (\Throwable $failure) {
            Storage::disk('local')->delete($path);
            throw $failure;
        }
    }

    public function download(EntranceExam $exam, string $source)
    {
        if ($source === 'uploaded') {
            abort_unless($exam->has_roster_pdf && Storage::disk('local')->exists($exam->roster_pdf_path), 404, 'No uploaded roster PDF is available for this session.');
            return Storage::disk('local')->download($exam->roster_pdf_path, 'entrance-exam-'.$exam->id.'-uploaded-roster.pdf', [
                'Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        $assignments = $exam->examAssignments()->with('applicant:id,first_name,middle_name,last_name')->get()
            ->sortBy(fn ($record) => mb_strtolower(($record->applicant?->last_name ?? '').' '.($record->applicant?->first_name ?? '')))->values();
        $options = new Options(['isRemoteEnabled' => false, 'isPhpEnabled' => false, 'isJavascriptEnabled' => false, 'defaultFont' => 'DejaVu Sans']);
        $pdf = new Dompdf($options);
        $pdf->loadHtml(view('pdf.entrance-exam-roster', compact('exam', 'assignments'))->render(), 'UTF-8');
        $pdf->setPaper('A4', 'portrait');
        $pdf->render();
        $pdf->getCanvas()->page_text(470, 807, 'Page {PAGE_NUM} of {PAGE_COUNT}', null, 8, [0.3, 0.36, 0.42]);
        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="entrance-exam-'.$exam->id.'-roster.pdf"',
            'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
