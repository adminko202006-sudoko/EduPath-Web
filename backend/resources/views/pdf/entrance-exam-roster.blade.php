<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Entrance examination roster</title>
<style>
@page { margin: 36px 40px 52px; }
body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #243746; }
.brand { color: #123B5D; font-size: 19px; font-weight: bold; margin: 0; }
.college { margin: 3px 0 18px; color: #526675; }
h1 { font-size: 17px; color: #123B5D; border-bottom: 3px solid #F4B400; padding-bottom: 10px; }
.details { background: #F4F7FA; padding: 12px; line-height: 1.8; margin-bottom: 16px; }
.note { font-size: 9px; line-height: 1.6; color: #526675; margin-bottom: 14px; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; }
thead { display: table-header-group; }
th { color: white; background: #123B5D; text-align: left; padding: 9px; }
td { border-bottom: 1px solid #DDE5EC; padding: 8px 9px; overflow-wrap: break-word; }
tr { page-break-inside: avoid; }
.number { width: 8%; }
.generated { margin-top: 16px; font-size: 8px; color: #526675; }
</style></head><body>
<p class="brand">EduPath</p><p class="college">Trinidad Municipal College</p>
<h1>{{ $exam->title }} — Applicant Roster</h1>
<div class="details">
<strong>Date:</strong> {{ $exam->exam_date->format('F j, Y') }}<br>
<strong>Time:</strong> {{ \Carbon\Carbon::parse($exam->start_time)->format('g:i A') }} – {{ \Carbon\Carbon::parse($exam->end_time)->format('g:i A') }}<br>
<strong>Venue:</strong> {{ $exam->venue }}<br>
<strong>Examination:</strong> 100 questions · 100 points · Passing score: 40/100<br>
<strong>Assigned applicants:</strong> {{ $assignments->count() }}
</div>
<p class="note">Check your name and session details below. Contact Admissions if your details need correction. This roster confirms assignment to this session; it does not announce examination results or scholarship awards.</p>
<table><colgroup><col style="width: 8%;"><col style="width: 92%;"></colgroup><thead><tr><th class="number" style="width: 8%;">No.</th><th style="width: 92%;">Applicant name</th></tr></thead><tbody>
@forelse ($assignments as $index => $assignment)
<tr><td>{{ $index + 1 }}</td><td>{{ $assignment->applicant ? trim($assignment->applicant->last_name.', '.$assignment->applicant->first_name.' '.($assignment->applicant->middle_name ?? '')) : 'Applicant record unavailable' }}</td></tr>
@empty
<tr><td colspan="2">No applicants have been assigned to this session yet.</td></tr>
@endforelse
</tbody></table>
<p class="generated">Generated {{ now()->format('F j, Y, g:i A') }} ({{ config('app.timezone') }}). Roster may change as Admin assigns applicants.</p>
</body></html>
