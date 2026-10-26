<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LocationCatalog;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    private function response(array $data)
    {
        return response()->json(['data' => $data])->header('Cache-Control', 'public, max-age=86400');
    }

    public function countries(LocationCatalog $catalog)
    {
        return $this->response($catalog->countries());
    }

    public function provinces(string $country, LocationCatalog $catalog)
    {
        return $this->response($catalog->country($country)['provinces']);
    }

    public function cities(string $country, Request $request, LocationCatalog $catalog)
    {
        $validated = $request->validate(['province_id' => 'nullable|string|max:20']);

        return $this->response($catalog->cities($country, $validated['province_id'] ?? null));
    }
}
