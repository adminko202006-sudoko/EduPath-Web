// Run from the repository root after downloading the files listed in SOURCE.md.
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const path = require('node:path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, 'source', name));
const countries = JSON.parse(read('countries.json'));
const states = JSON.parse(read('states.json'));
const cities = JSON.parse(zlib.gunzipSync(read('cities.json.gz')));
fs.mkdirSync(path.join(root, 'countries'), { recursive: true });
const sort = rows => rows.sort((a, b) => a.name.localeCompare(b.name, 'en'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value));
let orphanCities = 0;
for (const country of countries) {
  const provinces = sort(states.filter(s => s.country_code === country.iso2)
    .map(s => ({ id: String(s.id), name: s.name })));
  const ids = new Set(provinces.map(s => s.id));
  const localCities = sort(cities.filter(c => c.country_code === country.iso2).map(c => {
    const province = ids.has(String(c.state_id)) ? String(c.state_id) : null;
    if (!province && c.state_id) orphanCities++;
    return { id: String(c.id), name: c.name, province_id: province };
  }));
  write(`countries/${country.iso2}.json`, { provinces, cities: localCities });
}
write('countries.json', sort(countries.map(c => ({ id: c.iso2, name: c.name }))));
write('snapshot.json', {
  retrieved_on: '2026-10-24', source: 'https://github.com/dr5hn/countries-states-cities-database',
  license: 'ODbL-1.0', countries: countries.length, provinces: states.length,
  cities: cities.length, cities_without_matching_province: orphanCities,
  sha256: Object.fromEntries(['countries.json', 'states.json', 'cities.json.gz'].map(name =>
    [name, crypto.createHash('sha256').update(read(name)).digest('hex')]))
});
fs.copyFileSync(path.join(root, 'source/LICENSE'), path.join(root, 'LICENSE'));
console.log(JSON.stringify({ countries: countries.length, provinces: states.length, cities: cities.length, orphanCities }));
