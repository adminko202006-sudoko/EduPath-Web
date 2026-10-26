// Override the worldwide populated-place list with the PSA-derived PSGC hierarchy.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const read = name => fs.readFileSync(path.join(__dirname, 'source', name));
const provinces = JSON.parse(read('psgc-provinces.json'));
const regions = JSON.parse(read('psgc-regions.json'));
const sourceCities = JSON.parse(read('psgc-cities.json'));
const choices = provinces.map(p => ({ id: p.code, name: p.name }));
const regionGroups = new Map();
const cities = sourceCities
  // Manila's sub-municipal districts belong in street/barangay details, not this city list.
  .filter(c => !c.code.startsWith('13806') || c.code === '1380600000')
  .map(city => {
    const province = provinces.find(p => p.code.slice(0, 5) === city.code.slice(0, 5));
    if (province) return { id: city.code, name: city.name, province_id: province.code };
    const region = regions.find(r => r.code.slice(0, 2) === city.code.slice(0, 2));
    if (!region) throw new Error(`Missing parent for ${city.code}`);
    // NCR and cities outside provinces are grouped by their actual PSGC region.
    regionGroups.set(region.code, { id: region.code, name: region.name });
    return { id: city.code, name: city.name, province_id: region.code };
  });
const sort = rows => rows.sort((a, b) => a.name.localeCompare(b.name, 'en'));
const write = (name, value) => fs.writeFileSync(path.join(__dirname, name), JSON.stringify(value));
write('countries/PH.json', { provinces: sort([...choices, ...regionGroups.values()]), cities: sort(cities) });
write('philippines-snapshot.json', {
  source: 'https://github.com/alkevintan/psgc-rb', upstream: 'https://psa.gov.ph/classification/psgc/',
  source_period: '1Q 2026', retrieved_on: '2026-10-24', license: 'MIT (mirror); PSA attribution retained',
  commit: read('psgc-commit.txt').toString('utf8').trim(),
  provinces: provinces.length, region_groups_for_cities_outside_provinces: regionGroups.size,
  cities_and_municipalities: cities.length, excluded_manila_submunicipal_districts: sourceCities.length - cities.length,
  sha256: Object.fromEntries(['psgc-provinces.json', 'psgc-cities.json', 'psgc-regions.json'].map(name =>
    [name, crypto.createHash('sha256').update(read(name)).digest('hex')]))
});
console.log(JSON.stringify({ provinces: provinces.length, regions: regionGroups.size, cities: cities.length,
  bohol: cities.filter(c => c.province_id === '0701200000').length }));
