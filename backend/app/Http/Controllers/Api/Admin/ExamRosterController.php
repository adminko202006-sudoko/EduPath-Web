<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EntranceExam;
use App\Services\EntranceExamRosterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamRosterController extends Controller
{
    public function store(Request $request, EntranceExam $exam, EntranceExamRosterService $rosters)
    {
        $request->validate(['roster_pdf' => array_merge(['required'], array_diff(EntranceExamRosterService::uploadRules(), ['nullable']))]);
        return DB::transaction(function () use ($request, $exam, $rosters) {
            $locked = EntranceExam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            $rosters->upload($locked, $request->file('roster_pdf'), $request->user());
            return response()->json(['success' => true, 'message' => 'Roster PDF uploaded.', 'data' => $locked]);
        });
    }

    public function show(Request $request, EntranceExam $exam, EntranceExamRosterService $rosters)
    {
        $values = $request->validate(['source' => 'sometimes|in:uploaded,generated']);
        return $rosters->download($exam, $values['source'] ?? 'generated');
    }
}
