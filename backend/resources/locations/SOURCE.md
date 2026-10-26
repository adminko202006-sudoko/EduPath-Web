# Address lookup data

Adapted from [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database), retrieved 24 October 2026. The compact database in this directory is distributed under ODbL 1.0; see LICENSE. Names and source IDs are retained; unused attributes are removed. This is community maintained data, not a claim of official geographic completeness. Registration supports manual province/city entry for missing locations.

Source downloads (place in `source/` and run `node backend/resources/locations/build-catalog.cjs` from the repository root):

- https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json
- https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/states.json
- https://github.com/dr5hn/countries-states-cities-database/releases/latest/download/json-cities.json.gz
- https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/LICENSE

See snapshot.json for input checksums and actual record counts. Downloaded source files are build inputs, not needed at runtime. Countries without subdivisions and any city without a matching subdivision can be selected at country level. Philippine geography can be checked against the [PSA PSGC](https://psa.gov.ph/classifications-api/psgc).

## Philippine override

The worldwide dataset includes barangays as populated places, so it is **not** used for the Philippine province/city lists. `countries/PH.json` is instead derived from the [psgc-rb mirror](https://github.com/alkevintan/psgc-rb) of the PSA 1Q 2026 Publication Datafile. See PSGC-LICENSE and philippines-snapshot.json for license, pinned source commit, input checksums and counts. The PSA's 3Q 2026 publication download was blocked by its website challenge during implementation; this snapshot is explicitly dated and is not represented as the latest official release.

Download `data/provinces.json`, `data/cities_municipalities.json`, and `data/regions.json` from the pinned commit to `source/psgc-provinces.json`, `source/psgc-cities.json`, and `source/psgc-regions.json`; save the commit hash to `source/psgc-commit.txt`. Run `node backend/resources/locations/build-philippines.cjs` **after** building the worldwide catalog. It retains 82 provinces and 1,642 cities/municipalities. Manila's 14 sub-municipal districts are excluded from the city selector. Cities without a province are grouped by their actual PSGC region; the Philippine field is labelled Province/region. Province names and city names are retained as published by the mirror. This is a local data snapshot; no third-party API is called during registration. Later administrative changes can be entered through the manual option until the next snapshot refresh.
