<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class LocationCatalog
{
    public function countries(): array
    {
        return json_decode(file_get_contents(resource_path('locations/countries.json')), true, flags: JSON_THROW_ON_ERROR);
    }

    public function country(string $code): array
    {
        if (!preg_match('/^[A-Z]{2}$/D', $code) || !collect($this->countries())->contains('id', $code)) {
            throw ValidationException::withMessages(['country_code' => 'Please select a valid country.']);
        }

        return json_decode(file_get_contents(resource_path("locations/countries/{$code}.json")), true, flags: JSON_THROW_ON_ERROR);
    }

    public function cities(string $code, ?string $provinceId): array
    {
        $country = $this->country($code);
        if ($provinceId !== null && !collect($country['provinces'])->contains('id', $provinceId)) {
            throw ValidationException::withMessages(['province_id' => 'Please select a province in the chosen country.']);
        }

        return array_values(array_filter($country['cities'], fn ($city) => $city['province_id'] === $provinceId));
    }

    /** Resolve selected IDs to catalog names instead of trusting client labels. */
    public function address(array $parts): string
    {
        $country = collect($this->countries())->firstWhere('id', $parts['country_code']);
        if (!$country) {
            throw ValidationException::withMessages(['address_components.country_code' => 'Please select a valid country.']);
        }
        $catalog = $this->country($country['id']);
        $provinceId = $parts['province_id'] ?? null;
        $province = $provinceId ? collect($catalog['provinces'])->firstWhere('id', $provinceId) : null;
        if ($provinceId && !$province) {
            throw ValidationException::withMessages(['address_components.province_id' => 'The province does not belong to the selected country.']);
        }
        $provinceName = $province['name'] ?? trim($parts['province'] ?? '');
        if ($catalog['provinces'] && $provinceName === '') {
            throw ValidationException::withMessages(['address_components.province' => 'Please select or enter your province/state.']);
        }
        $cityId = $parts['city_id'] ?? null;
        $city = $cityId ? collect($catalog['cities'])->firstWhere('id', $cityId) : null;
        if ($cityId && (!$city || $city['province_id'] !== $provinceId)) {
            throw ValidationException::withMessages(['address_components.city_id' => 'The city does not belong to the selected province and country.']);
        }
        $cityName = $city['name'] ?? trim($parts['city'] ?? '');
        if ($cityName === '') {
            throw ValidationException::withMessages(['address_components.city' => 'Please select or enter your city/municipality.']);
        }
        $address = implode(', ', array_filter([trim($parts['street']), $cityName, $provinceName, $country['name']], fn ($part) => $part !== ''));
        if (mb_strlen($address) > 500) {
            throw ValidationException::withMessages(['address_components.street' => 'Your complete address must be no longer than 500 characters.']);
        }

        return $address;
    }
}
