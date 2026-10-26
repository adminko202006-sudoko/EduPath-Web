<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ScholarshipRequirementUploads
{
    public function validate(Request $request, array $names): void
    {
        $rules = ['requirement_documents' => $names ? 'required|array|size:'.count($names) : 'prohibited'];
        $labels = [];
        foreach ($names as $index => $name) {
            $rules["requirement_documents.$index"] = 'required|file|mimes:pdf,jpg,jpeg,png|max:5120';
            $labels["requirement_documents.$index"] = $name;
        }
        $request->validate($rules, [], $labels);
        $total = array_sum(array_map(fn ($file) => $file->getSize(), $request->file('requirement_documents', [])));
        $total += $request->file('supporting_document')?->getSize() ?? 0;
        if ($total > 25 * 1024 * 1024) {
            throw ValidationException::withMessages(['requirement_documents' => ['The combined scholarship attachments must be no larger than 25 MB.']]);
        }
    }
}
